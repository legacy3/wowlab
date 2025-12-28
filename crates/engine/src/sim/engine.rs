/*
OPTIMIZATION NOTES (benchmarked with ~9300 events/sim, ~13K sims/sec = 120M events/sec):

IMPLEMENTED:
✓ Timing wheel with bitmap - O(1) slot lookup via 64-word bitmap + trailing_zeros()
✓ Inline function calls for event handlers (#[inline(always)])
✓ Cache-friendly struct layouts with #[repr(C)]
✓ Lazy resource regeneration (compute on demand)
✓ Smart wake-up scheduling (avoid busy-looping)
✓ Precomputed stats (ap_normalized, crit_chance, vers_mult, haste_mult)
✓ Unchecked array indexing in hot path (record_damage)
✓ SpellRuntime table - pre-computed damage/cost/aura indices, avoids touching SpellDef
✓ Pre-resolved aura_id → aura_idx at config load (no linear search per cast)

TESTED BUT NOT BENEFICIAL:
✗ Quaternary (4-ary) heap - 36% SLOWER than binary heap
✗ Front buffer for same-time events - 7% SLOWER (overhead > benefit)
✗ meta_events batching - 5% SLOWER (peek overhead eats gains, even with avg 8 events/batch)
✗ large_capacity preallocation - no measurable difference
✗ RNG pool/batching - 3% SLOWER (xorshift64 already optimal, caching overhead > benefit)
✗ RNG dual-value extraction (upper/lower 32 bits from u64) - 2.5% SLOWER (NaN check overhead)
✗ inv_haste_mult precompute - 5% SLOWER (extra field hurts cache, compiler already optimizes div)
✗ EventQueue::clear bitmap drain - no measurable difference (vectorized fill already fast)

POTENTIAL FUTURE OPTIMIZATIONS (rough priority order):

=== HIGH IMPACT (10-25% potential) ===

1. Batch aura ticks into single sweep event (10-30% if aura-heavy)
   - Instead of N events for N active auras, one "tick sweep" event
   - Iterate active auras and apply tick damage in batch
   - Enables SIMD vectorization of tick damage calculation
   Where: engine.rs (aura tick handling), state.rs (active aura list/bitset)

=== MEDIUM IMPACT (3-8%) ===

2. SoA for spell_states (5-15%)
   - Switch spell_states: Vec<SpellState> to separate arrays
   - cooldown_ready[], charges[], cooldown_ms[], gcd_ms[], cost_amount[]
   - Cuts pointer chasing in find_castable_spell_inline
   Where: state.rs, engine.rs

3. Add duration checks before scheduling (1-5%)
   - Several push sites don't check time <= duration
   - Reduces queue size and leftover events that clear must handle
   Where: engine.rs (cast_spell_inline, handle_cooldown_ready_inline, handle_aura_apply_inline)

=== LOW IMPACT (1-5%) ===

4. Split hot/cold unit state
   - Put only hot fields in tight UnitHot struct
   - Move cold fields (auras, base_stats, casting) to separate struct
   Where: state.rs

5. Shrink TimedEvent if FIFO not required
   - Currently 16 bytes; could drop seq or use u16 seq
   Where: events.rs

6. AuraTracker to SoA (1-4%)
   - Convert [Option<AuraInstance>; 32] to expires[], stacks[], active[] arrays
   Where: state.rs

7. Early-return for spells with no effects
   - Add has_effects flag in runtime spell data
   Where: engine.rs, state.rs

=== OTHER ===

- Float precision: Keep damage as f32, avoid f32→f64 conversions
- WASM-specific: Profile in WASM, consider SIMD for batch damage
- Jump table for event dispatch (compiler may already do this)
*/

//! High-performance simulation engine with optimized event processing.
//!
//! - Inline processing of same-timestamp events (no rescheduling)
//! - Minimal event scheduling (only when state actually changes)
//! - Specialized hot-path handlers with aggressive inlining
//! - Lazy resource regeneration (compute on demand)
//! - Smart wake-up scheduling to avoid busy-looping
//! - Cache-friendly access patterns

use crate::config::SimConfig;
use crate::util::FastRng;

use super::{BatchAccumulator, BatchResult, SimEvent, SimResult, SimState};

/// Convert f32 seconds to u32 milliseconds
#[inline(always)]
fn to_ms(seconds: f32) -> u32 {
    (seconds * 1000.0) as u32
}

/// Dispatch a single event - extracted for reuse in meta_events mode
#[inline(always)]
fn dispatch_event(
    state: &mut SimState,
    config: &SimConfig,
    rng: &mut FastRng,
    event: SimEvent,
) {
    match event {
        SimEvent::GcdReady => {
            state.player.gcd_event_pending = false;
            handle_gcd_ready_inline(state, rng);
        }

        SimEvent::CooldownReady { spell_idx } => {
            handle_cooldown_ready_inline(state, spell_idx);
        }

        SimEvent::AuraTick { aura_idx } => {
            handle_aura_tick_inline(state, aura_idx, rng);
        }

        SimEvent::AuraExpire { aura_idx } => {
            handle_aura_expire_inline(state, aura_idx);
        }

        SimEvent::AuraApply { aura_idx, stacks } => {
            handle_aura_apply_inline(state, config, aura_idx, stacks);
        }

        SimEvent::SpellDamage { spell_idx, damage_x100 } => {
            let damage = (damage_x100 as f32) / 100.0;
            state.results.record_damage(spell_idx as usize, damage as f64);
            state.target.health -= damage;
        }

        SimEvent::AutoAttack => {
            handle_auto_attack_inline(state, config, rng);
        }
        SimEvent::PetAttack => {
            handle_pet_attack_inline(state, config, rng);
        }
        SimEvent::ResourceTick => {}

        SimEvent::CastComplete { spell_idx } => {
            let _ = spell_idx;
        }
    }
}

/// Run a single simulation - the core hot loop.
#[inline]
pub fn run_simulation(state: &mut SimState, config: &SimConfig, rng: &mut FastRng) -> SimResult {
    state.reset();

    // Schedule initial GCD ready (start of combat)
    state.events.push(0, SimEvent::GcdReady);
    state.player.gcd_event_pending = true;

    // Schedule initial auto-attack if weapon speed > 0
    if config.player.weapon_speed > 0.0 {
        state.events.push(0, SimEvent::AutoAttack);
    }

    // Schedule initial pet attack if pet exists
    if let Some(ref pet) = config.pet {
        if pet.attack_speed > 0.0 {
            state.events.push(0, SimEvent::PetAttack);
        }
    }

    let duration = state.duration;

    // Meta events: process same-time events together (minimal overhead version)
    #[cfg(feature = "meta_events")]
    {
        let mut current_batch_time = 0u32;
        let mut batch_count = 0u32;
        let mut first_event = true;

        while let Some(timed_event) = state.events.pop() {
            let event_time = timed_event.time;
            if event_time > duration {
                break;
            }

            // Only update time when timestamp changes (not every event)
            if first_event || event_time != current_batch_time {
                first_event = false;
                // New batch
                if batch_count > 0 {
                    state.events.batches_processed += 1;
                    if batch_count > state.events.max_batch_size {
                        state.events.max_batch_size = batch_count;
                    }
                }
                current_batch_time = event_time;
                state.time = event_time;
                batch_count = 0;
            }

            batch_count += 1;
            dispatch_event(state, config, rng, timed_event.event);
        }

        // Final batch
        if batch_count > 0 {
            state.events.batches_processed += 1;
            if batch_count > state.events.max_batch_size {
                state.events.max_batch_size = batch_count;
            }
        }
    }

    // Standard: process events one at a time
    #[cfg(not(feature = "meta_events"))]
    {
        while let Some(timed_event) = state.events.pop() {
            let event_time = timed_event.time;

            if event_time > duration {
                break;
            }

            state.time = event_time;
            dispatch_event(state, config, rng, timed_event.event);
        }
    }

    // Duration is in ms, convert to seconds for DPS
    let duration_secs = duration as f64 / 1000.0;
    SimResult {
        damage: state.results.total_damage,
        dps: state.results.total_damage / duration_secs,
        casts: state.results.cast_count,
    }
}

/// Run a batch of simulations with state reuse.
pub fn run_batch(
    state: &mut SimState,
    config: &SimConfig,
    rng: &mut FastRng,
    iterations: u32,
    base_seed: u64,
) -> BatchResult {
    let mut accum = BatchAccumulator::new();

    for i in 0..iterations {
        rng.reseed(base_seed.wrapping_add(i as u64));
        let result = run_simulation(state, config, rng);
        accum.add(&result, &state.results.spell_damage, &state.results.spell_casts);
    }

    let spell_ids: Vec<u32> = config.spells.iter().map(|s| s.id).collect();
    accum.finalize(config.duration, &spell_ids)
}

/// Handle GCD ready - the most frequent event, heavily optimized.
/// Inlines rotation evaluation and spell casting for maximum performance.
#[inline(always)]
fn handle_gcd_ready_inline(state: &mut SimState, rng: &mut FastRng) {
    let current_time = state.time;

    // Lazy resource regeneration - only compute when needed
    let elapsed_ms = current_time - state.player.last_resource_update;
    if elapsed_ms > 0 {
        // Convert ms to seconds for regen calculation
        state.player.resources.regen(elapsed_ms as f32 * 0.001);
        state.player.last_resource_update = current_time;
    }

    // Inline rotation evaluation - find first castable spell (uses spell_runtime)
    let spell_idx = find_castable_spell_inline(state, current_time);

    if let Some(idx) = spell_idx {
        // Cast the spell inline (uses spell_runtime)
        cast_spell_inline(state, idx, rng, current_time);
    } else {
        // No spell available - compute next wake-up time (uses spell_runtime)
        schedule_next_opportunity_inline(state, current_time);
    }
}

/// Find the first castable spell - inlined rotation evaluation.
#[inline(always)]
fn find_castable_spell_inline(state: &SimState, current_time: u32) -> Option<usize> {
    let player = &state.player;
    let gcd_ready = player.gcd_ready <= current_time;
    let current_resource = player.resources.current;

    // Fast path: if GCD not ready, nothing is castable
    if !gcd_ready {
        return None;
    }

    // Iterate through spells in priority order (use runtime data, not config)
    for (idx, spell_rt) in state.spell_runtime.iter().enumerate() {
        let spell_state = &player.spell_states[idx];

        // Check cooldown/charges - most common rejection
        let cd_ready = spell_state.charges > 0 || spell_state.cooldown_ready <= current_time;
        if !cd_ready {
            continue;
        }

        // Check resources (use pre-computed cost_amount)
        if current_resource < spell_rt.cost_amount {
            continue;
        }

        // Spell is castable
        return Some(idx);
    }

    None
}

/// Cast a spell - inlined for performance.
#[inline(always)]
fn cast_spell_inline(
    state: &mut SimState,
    spell_idx: usize,
    rng: &mut FastRng,
    current_time: u32,
) {
    let spell_rt = &state.spell_runtime[spell_idx];
    let spell_state = &mut state.player.spell_states[spell_idx];

    // Consume resources (use pre-computed cost_amount)
    state.player.resources.spend(spell_rt.cost_amount);

    // Handle cooldown/charges (use pre-computed max_charges)
    let cooldown_ms = spell_state.cooldown_ms;
    let max_charges = spell_rt.max_charges;
    if max_charges > 0 {
        // Charge-based spell
        spell_state.charges -= 1;

        // Start recharge if we just went below max
        if spell_state.charges == max_charges - 1 {
            spell_state.cooldown_ready = current_time + cooldown_ms;
            state.events.push(
                spell_state.cooldown_ready,
                SimEvent::CooldownReady { spell_idx: spell_idx as u8 },
            );
        }
    } else if cooldown_ms > 0 {
        // Regular cooldown spell
        spell_state.cooldown_ready = current_time + cooldown_ms;
        // No event needed - rotation will check cooldown_ready
    }

    // Apply GCD and schedule next check (apply haste to base GCD)
    let gcd_ms = spell_state.gcd_ms;
    let hasted_gcd_ms = if gcd_ms > 0 {
        // Apply haste: gcd_ms / haste_mult
        (gcd_ms as f32 / state.player.stats.haste_mult) as u32
    } else {
        0
    };

    if hasted_gcd_ms > 0 {
        state.player.gcd_ready = current_time + hasted_gcd_ms;
        if !state.player.gcd_event_pending {
            state.events.push(state.player.gcd_ready, SimEvent::GcdReady);
            state.player.gcd_event_pending = true;
        }
    } else {
        // Off-GCD spell - immediately try to cast another
        // Use push_immediate to avoid heap operation if possible
        if !state.player.gcd_event_pending {
            state.events.push_immediate(current_time, SimEvent::GcdReady);
            state.player.gcd_event_pending = true;
        }
    }

    // Calculate and record damage inline
    calculate_damage_inline(state, spell_idx, rng);
}

/// Calculate damage for a spell - inlined with all multipliers.
#[inline(always)]
fn calculate_damage_inline(
    state: &mut SimState,
    spell_idx: usize,
    _rng: &mut FastRng,
) {
    let spell_rt = &state.spell_runtime[spell_idx];
    let stats = &state.player.stats;

    // Expected base damage (midpoint of range)
    let base_damage = (spell_rt.damage_min + spell_rt.damage_max) * 0.5;

    // Attack power contribution (use pre-computed ap_coefficient)
    let ap_damage = spell_rt.ap_coefficient * stats.attack_power;

    // Total damage with expected crit multiplier: 1 + crit_chance * (crit_mult - 1)
    // For 2x crit multiplier: 1 + crit_chance
    let total_damage = (base_damage + ap_damage) * (1.0 + stats.crit_chance) * stats.vers_mult;

    // Record damage
    state.results.record_damage(spell_idx, total_damage as f64);
    state.target.health -= total_damage;
    state.results.record_cast();

    // Process spell effects (apply auras, trigger spells, etc.)
    process_spell_effects_inline(state, spell_idx);
}

/// Process spell effects - apply auras, trigger spells, etc.
/// Uses pre-resolved aura indices (no more linear search per cast)
#[inline(always)]
fn process_spell_effects_inline(state: &mut SimState, spell_idx: usize) {
    let spell_rt = &state.spell_runtime[spell_idx];
    let current_time = state.time;

    // Apply pre-resolved auras (no linear search - O(1) per aura)
    for i in 0..spell_rt.apply_aura_count as usize {
        let aura_idx = spell_rt.apply_aura_indices[i];
        state.events.push(
            current_time,
            SimEvent::AuraApply {
                aura_idx,
                stacks: 1,
            },
        );
    }

    // Apply pre-computed energize effect
    if spell_rt.energize_amount > 0.0 {
        state.player.resources.gain(spell_rt.energize_amount);
    }
}

/// Schedule next opportunity when no spell is castable.
/// Computes the earliest time any spell becomes available.
#[inline]
fn schedule_next_opportunity_inline(state: &mut SimState, current_time: u32) {
    if state.player.gcd_event_pending {
        return;
    }

    let duration = state.duration;
    let mut next_time = u32::MAX;

    let player = &state.player;
    let regen_rate = player.resources.regen_per_second;
    let current_resource = player.resources.current;

    // Use spell_runtime for cost_amount (avoid touching config.spells)
    for (idx, spell_rt) in state.spell_runtime.iter().enumerate() {
        let spell_state = &player.spell_states[idx];

        // Cooldown ready time
        let cd_ready_time = if spell_state.charges > 0 {
            current_time
        } else {
            spell_state.cooldown_ready
        };

        // Resource ready time (convert to ms) - use pre-computed cost_amount
        let resource_ready_time = if current_resource >= spell_rt.cost_amount {
            current_time
        } else if regen_rate > 0.0 {
            let needed = spell_rt.cost_amount - current_resource;
            current_time + to_ms(needed / regen_rate)
        } else {
            u32::MAX
        };

        // Spell ready at later of CD and resource
        let spell_ready = cd_ready_time.max(resource_ready_time);

        if spell_ready < next_time {
            next_time = spell_ready;
        }
    }

    // Also consider GCD
    next_time = next_time.max(player.gcd_ready);

    // Schedule if valid
    if next_time < duration && next_time > current_time {
        state.events.push(next_time, SimEvent::GcdReady);
        state.player.gcd_event_pending = true;
    }
}

/// Handle cooldown ready - updates charge and potentially triggers rotation check.
#[inline(always)]
fn handle_cooldown_ready_inline(state: &mut SimState, spell_idx: u8) {
    let idx = spell_idx as usize;
    let spell_rt = &state.spell_runtime[idx];
    let spell_state = &mut state.player.spell_states[idx];

    // Only charge-based spells trigger this event (use pre-computed max_charges)
    let max_charges = spell_rt.max_charges;
    if max_charges > 0 {
        if spell_state.charges < max_charges {
            spell_state.charges += 1;

            // Schedule next charge if not at max
            if spell_state.charges < max_charges {
                spell_state.cooldown_ready = state.time + spell_state.cooldown_ms;
                state.events.push(
                    spell_state.cooldown_ready,
                    SimEvent::CooldownReady { spell_idx },
                );
            }
        }
    }

    // Trigger rotation check if not on GCD and no pending event
    if state.player.gcd_ready <= state.time && !state.player.gcd_event_pending {
        state.events.push_immediate(state.time, SimEvent::GcdReady);
        state.player.gcd_event_pending = true;
    }
}

/// Handle aura tick - process DoT/HoT damage.
#[inline(always)]
fn handle_aura_tick_inline(
    state: &mut SimState,
    aura_idx: u8,
    _rng: &mut FastRng,
) {
    let idx = aura_idx as usize;
    let runtime = &state.aura_runtime[idx];

    // Get remaining time in ms - also checks if aura is active (returns 0 if not)
    let remaining = state.player.auras.remaining_slot(idx, state.time);
    if remaining == 0 {
        return;
    }

    // Process periodic damage with expected crit (pre-computed, no Vec iteration)
    if runtime.tick_amount > 0.0 || runtime.tick_coefficient > 0.0 {
        let base_damage = runtime.tick_amount + runtime.tick_coefficient * state.player.stats.attack_power;

        // Expected damage: base * (1 + crit_chance) * vers_mult
        let damage = base_damage * (1.0 + state.player.stats.crit_chance) * state.player.stats.vers_mult;

        state.results.total_damage += damage as f64;
        state.target.health -= damage;
    }

    // Schedule next tick if aura still has duration remaining
    let tick_interval_ms = runtime.tick_interval_ms;
    if tick_interval_ms > 0 {
        let next_tick = state.time + tick_interval_ms;
        if next_tick < state.time + remaining {
            state.events.push(next_tick, SimEvent::AuraTick { aura_idx });
        }
    }
}

/// Handle aura expiration.
#[inline(always)]
fn handle_aura_expire_inline(state: &mut SimState, aura_idx: u8) {
    let idx = aura_idx as usize;
    // Only remove if actually expired (handles refresh case where old expire event is stale)
    let remaining = state.player.auras.remaining_slot(idx, state.time);
    if remaining == 0 {
        state.player.auras.remove_slot(idx);
    }
}

/// Handle aura application.
#[inline(always)]
fn handle_aura_apply_inline(
    state: &mut SimState,
    config: &SimConfig,
    aura_idx: u8,
    stacks: u8,
) {
    let idx = aura_idx as usize;

    if idx >= config.auras.len() {
        return;
    }

    let aura_def = &config.auras[idx];
    let runtime = &state.aura_runtime[idx];

    #[cfg(feature = "debug_logging")]
    eprintln!("AuraApply: {} to slot {} at time {}", aura_def.name, idx, state.time);

    // Apply using slot index - O(1)
    state.player.auras.apply_slot(
        idx,
        runtime.duration_ms,
        aura_def.max_stacks,
        state.time,
    );

    #[cfg(feature = "debug_logging")]
    eprintln!("  -> has_slot({}) = {}", idx, state.player.auras.has_slot(idx));

    // Schedule expiration
    state.events.push(
        state.time + runtime.duration_ms,
        SimEvent::AuraExpire { aura_idx },
    );

    // Schedule first tick if DoT/HoT
    if runtime.tick_interval_ms > 0 {
        state.events.push(
            state.time + runtime.tick_interval_ms,
            SimEvent::AuraTick { aura_idx },
        );
    }

    let _ = stacks;
}

/// Handle pet attack - melee swing damage and schedule next.
#[inline(always)]
fn handle_pet_attack_inline(state: &mut SimState, config: &SimConfig, _rng: &mut FastRng) {
    let current_time = state.time;

    let pet = match &config.pet {
        Some(p) => p,
        None => return,
    };

    if pet.attack_speed <= 0.0 {
        return;
    }

    let (min_dmg, max_dmg) = pet.attack_damage;
    let pet_stats = &pet.stats;

    // Expected pet damage
    let base_damage = (min_dmg + max_dmg) * 0.5;
    let ap_bonus = pet_stats.ap_normalized * pet.attack_speed;
    let damage = (base_damage + ap_bonus) * (1.0 + pet_stats.crit_chance);

    // Record damage
    state.results.total_damage += damage as f64;
    state.target.health -= damage;

    // Schedule next pet attack
    let next_attack = current_time + state.pet_attack_speed_ms;
    if next_attack < state.duration {
        state.events.push(next_attack, SimEvent::PetAttack);
    }
}

/// Handle auto-attack - melee swing damage and schedule next.
#[inline(always)]
fn handle_auto_attack_inline(state: &mut SimState, config: &SimConfig, _rng: &mut FastRng) {
    let current_time = state.time;
    let weapon_speed = config.player.weapon_speed;

    if weapon_speed <= 0.0 {
        return;
    }

    let stats = &state.player.stats;
    let (min_dmg, max_dmg) = config.player.weapon_damage;

    // Expected weapon damage
    let weapon_damage = (min_dmg + max_dmg) * 0.5;
    let ap_bonus = stats.ap_normalized * weapon_speed;
    let damage = (weapon_damage + ap_bonus) * (1.0 + stats.crit_chance) * stats.vers_mult;

    // Record damage (use index 255 for auto-attacks to avoid collision with spells)
    state.results.total_damage += damage as f64;
    state.target.health -= damage;

    // Schedule next auto-attack (apply haste to pre-computed weapon speed)
    let next_swing_ms = (state.weapon_speed_ms as f32 / stats.haste_mult) as u32;
    let next_swing = current_time + next_swing_ms;

    if next_swing < state.duration {
        state.events.push(next_swing, SimEvent::AutoAttack);
    }
}
