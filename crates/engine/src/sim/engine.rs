/*
OPTIMIZATION NOTES (benchmarked with ~9300 events/sim, ~13K sims/sec = 120M events/sec):

IMPLEMENTED:
✓ Timing wheel with bitmap - O(1) slot lookup via 64-word bitmap + trailing_zeros()
✓ Inline function calls for event handlers (#[inline(always)])
✓ Cache-friendly struct layouts with #[repr(C)]
✓ Lazy resource regeneration (compute on demand)
✓ Smart wake-up scheduling (avoid busy-looping)
✓ Paperdoll StatCache for all damage/haste calculations (attack_power, crit_mult, damage_multiplier, haste_mult)
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

use rayon::prelude::*;

use crate::config::SimConfig;
use crate::rotation::PredictiveRotation;
use crate::util::FastRng;

use super::{BatchAccumulator, BatchResult, SimEvent, SimReport, SimResult, SimState, SpellBreakdown};

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
    rotation: &mut PredictiveRotation,
    event: SimEvent,
) {
    match event {
        SimEvent::GcdReady => {
            state.player.gcd_event_pending = false;
            handle_gcd_ready_inline(state, config, rng, rotation);
        }

        SimEvent::CooldownReady { spell_idx } => {
            handle_cooldown_ready_inline(state, spell_idx);
        }

        // These events are no longer scheduled (lazy tick evaluation)
        SimEvent::AuraTick { .. } => {}
        SimEvent::AuraExpire { .. } => {}
        SimEvent::AuraApply { .. } => {}

        SimEvent::SpellDamage {
            spell_idx,
            damage_x100,
        } => {
            let damage = (damage_x100 as f32) / 100.0;
            state.results.record_damage(spell_idx as usize, damage);
            state.target.health -= damage;
        }

        // Auto/pet attacks are now processed lazily
        SimEvent::AutoAttack => {}
        SimEvent::PetAttack => {}
        SimEvent::ResourceTick => {}

        SimEvent::CastComplete { spell_idx } => {
            let _ = spell_idx;
        }
    }
}

/// Run a single simulation - the core hot loop.
#[inline]
pub fn run_simulation(
    state: &mut SimState,
    config: &SimConfig,
    rng: &mut FastRng,
    rotation: &mut PredictiveRotation,
) -> SimResult {
    state.reset();

    // Schedule initial GCD ready (start of combat)
    state.events.push(0, SimEvent::GcdReady);
    state.player.gcd_event_pending = true;

    // Initialize auto/pet attack times (lazy evaluation, no events)
    state.next_auto_attack = if config.player.weapon_speed > 0.0 {
        0
    } else {
        u32::MAX
    };
    state.next_pet_attack = if config
        .pet
        .as_ref()
        .map(|p| p.attack_speed > 0.0)
        .unwrap_or(false)
    {
        0
    } else {
        u32::MAX
    };

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
            dispatch_event(state, config, rng, rotation, timed_event.event);
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
            dispatch_event(state, config, rng, rotation, timed_event.event);
        }
    }

    // Process any remaining periodic effects up to end of simulation
    state.time = duration;
    process_pending_ticks(state, config, duration);

    // Duration is in ms, convert to seconds for DPS
    let duration_secs = duration as f32 / 1000.0;
    SimResult {
        damage: state.results.total_damage,
        dps: state.results.total_damage / duration_secs,
        casts: state.results.cast_count,
    }
}

/// Run a single simulation with detailed action logging.
/// Returns a SimReport with full action log and spell breakdown.
pub fn run_simulation_with_report(
    state: &mut SimState,
    config: &SimConfig,
    rng: &mut FastRng,
    rotation: &mut PredictiveRotation,
    spec_name: &str,
) -> SimReport {
    // Enable action logging
    state.enable_action_log(config);
    state.action_log.log_combat_start();

    // Run the simulation
    let result = run_simulation(state, config, rng, rotation);

    // Log combat end
    state.action_log.log_combat_end(state.duration, result.damage, result.dps);

    // Build spell breakdown
    let total_damage: f32 = state.results.spell_damage.iter().sum();
    let duration_secs = config.duration;
    let spell_breakdown: Vec<SpellBreakdown> = state
        .results
        .spell_damage
        .iter()
        .zip(state.results.spell_casts.iter())
        .enumerate()
        .filter(|(_, (dmg, _))| **dmg > 0.0)
        .map(|(idx, (damage, casts))| {
            let spell_id = config.spells.get(idx).map(|s| s.id).unwrap_or(0);
            SpellBreakdown {
                spell_id,
                total_damage: *damage,
                casts: *casts as u64,
                dps_contribution: *damage / duration_secs,
                pct_of_total: if total_damage > 0.0 {
                    *damage / total_damage * 100.0
                } else {
                    0.0
                },
            }
        })
        .collect();

    SimReport {
        spec: spec_name.to_string(),
        duration: config.duration,
        dps: result.dps,
        total_damage: result.damage,
        total_casts: result.casts,
        actions: std::mem::take(&mut state.action_log.entries),
        spell_breakdown,
    }
}

/// Run a batch of simulations with state reuse (single-threaded).
pub fn run_batch(
    state: &mut SimState,
    config: &SimConfig,
    rng: &mut FastRng,
    rotation: &mut PredictiveRotation,
    iterations: u32,
    base_seed: u64,
) -> BatchResult {
    let mut accum = BatchAccumulator::new();

    for i in 0..iterations {
        rng.reseed(base_seed.wrapping_add(i as u64));
        rotation.reset();
        let result = run_simulation(state, config, rng, rotation);
        accum.add(
            &result,
            &state.results.spell_damage,
            &state.results.spell_casts,
        );
    }

    let spell_ids: Vec<u32> = config.spells.iter().map(|s| s.id).collect();
    accum.finalize(config.duration, &spell_ids)
}

/// Run a batch of simulations in parallel using rayon.
///
/// Each thread gets its own SimState, RNG, and rotation instance.
/// Results are accumulated per-thread then merged at the end.
pub fn run_batch_parallel(
    config: &SimConfig,
    rotation_script: &str,
    iterations: u32,
    base_seed: u64,
) -> BatchResult {
    let accum = (0..iterations)
        .into_par_iter()
        .fold(
            || {
                // Thread-local init - called once per thread chunk
                let state = SimState::new(config);
                let rotation = PredictiveRotation::compile(rotation_script, config)
                    .expect("rotation already validated");
                let rng = FastRng::new(0);
                let accum = BatchAccumulator::new();
                (state, rotation, rng, accum)
            },
            |(mut state, mut rotation, mut rng, mut accum), i| {
                rng.reseed(base_seed.wrapping_add(i as u64));
                rotation.reset();
                let result = run_simulation(&mut state, config, &mut rng, &mut rotation);
                accum.add(
                    &result,
                    &state.results.spell_damage,
                    &state.results.spell_casts,
                );
                (state, rotation, rng, accum)
            },
        )
        .map(|(_, _, _, accum)| accum)
        .reduce(BatchAccumulator::new, |mut a, b| {
            a.merge(&b);
            a
        });

    let spell_ids: Vec<u32> = config.spells.iter().map(|s| s.id).collect();
    accum.finalize(config.duration, &spell_ids)
}

/// Process all pending periodic effects up to current time (lazy evaluation)
#[inline(always)]
fn process_pending_ticks(state: &mut SimState, config: &SimConfig, current_time: u32) {
    // Process DoT ticks using paperdoll cache
    let cache = &state.player.paperdoll.cache;
    let mut active_mask = state.player.auras.active_dot_mask();
    while active_mask != 0 {
        let idx = active_mask.trailing_zeros() as usize;
        active_mask &= active_mask - 1;

        let next_tick = state.player.auras.next_tick_time(idx);
        if next_tick == 0 || next_tick > current_time {
            continue;
        }

        let remaining = state.player.auras.remaining_slot(idx, current_time);
        if remaining == 0 {
            state.player.auras.stop_dot(idx);
            continue;
        }

        let runtime = &state.aura_runtime[idx];
        let tick_interval = runtime.tick_interval_ms;
        let aura_id = config.auras.get(idx).map(|a| a.id).unwrap_or(0);

        let mut tick_time = next_tick;
        while tick_time <= current_time {
            if state.player.auras.remaining_slot(idx, tick_time) == 0 {
                state.player.auras.stop_dot(idx);
                break;
            }

            if runtime.tick_amount > 0.0 || runtime.tick_coefficient > 0.0 {
                // Use paperdoll cache for damage calculation:
                // - cache.attack_power for AP scaling
                // - cache.crit_mult = 1.0 + crit_chance (expected crit multiplier)
                // - cache.damage_multiplier = (1 + vers) * (1 + aura_damage_pct)
                let base_damage = runtime.tick_amount
                    + runtime.tick_coefficient * cache.attack_power;
                let damage = base_damage * cache.crit_mult * cache.damage_multiplier;
                state.results.total_damage += damage;
                state.target.health -= damage;

                // Log DoT tick if action logging is enabled
                if state.action_log.enabled {
                    state.action_log.log_dot_tick(tick_time, idx, aura_id, damage);
                }
            }

            tick_time += tick_interval;
        }

        if tick_time < current_time + remaining {
            state.player.auras.set_next_tick(idx, tick_time);
        } else {
            state.player.auras.stop_dot(idx);
        }
    }

    // Process auto attacks using paperdoll cache
    let cache = &state.player.paperdoll.cache;
    while state.next_auto_attack <= current_time {
        let (min_dmg, max_dmg) = config.player.weapon_damage;
        let weapon_damage = (min_dmg + max_dmg) * 0.5;
        // Use AP / 14 * weapon_speed for normalized AP bonus (standard WoW formula)
        let ap_bonus = (cache.attack_power / 14.0) * config.player.weapon_speed;
        let damage = (weapon_damage + ap_bonus) * cache.crit_mult * cache.damage_multiplier;
        state.results.total_damage += damage;
        state.target.health -= damage;

        let next_swing_ms = (state.weapon_speed_ms as f32 / cache.haste_mult) as u32;
        state.next_auto_attack += next_swing_ms;
    }

    // Process pet attacks using pre-computed pet_stats
    if config.pet.is_some() {
        if let Some(ref pet_stats) = state.pet_stats {
            let pet_cfg = config.pet.as_ref().unwrap();
            while state.next_pet_attack <= current_time {
                let (min_dmg, max_dmg) = pet_cfg.attack_damage;
                // Use PetStats for damage calculation (already has inherited stats)
                let damage = pet_stats.calculate_auto_attack(min_dmg, max_dmg);
                state.results.total_damage += damage;
                state.target.health -= damage;

                // Use pet_stats.attack_speed_ms which is already haste-adjusted
                state.next_pet_attack += pet_stats.attack_speed_ms;
            }
        }
    }
}

/// Handle GCD ready - the most frequent event, heavily optimized.
#[inline(always)]
fn handle_gcd_ready_inline(
    state: &mut SimState,
    config: &SimConfig,
    rng: &mut FastRng,
    rotation: &mut PredictiveRotation,
) {
    let current_time = state.time;

    // Process pending periodic effects (lazy evaluation)
    process_pending_ticks(state, config, current_time);

    // Lazy resource regeneration - only compute when needed
    let elapsed_ms = current_time - state.player.last_resource_update;
    if elapsed_ms > 0 {
        // Convert ms to seconds for regen calculation
        state.player.resources.regen(elapsed_ms as f32 * 0.001);
        state.player.last_resource_update = current_time;
    }

    // Call rotation to get next spell (predictive condition gating)
    let spell_idx = rotation.get_next_action(state);

    if let Some(idx) = spell_idx {
        cast_spell_inline(state, config, idx as usize, rng, current_time);
    } else {
        // No spell available - compute next wake-up time
        schedule_next_opportunity_inline(state, current_time);
    }
}

/// Cast a spell - inlined for performance.
#[inline(always)]
fn cast_spell_inline(
    state: &mut SimState,
    config: &SimConfig,
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
                SimEvent::CooldownReady {
                    spell_idx: spell_idx as u8,
                },
            );
        }
    } else if cooldown_ms > 0 {
        // Regular cooldown spell
        spell_state.cooldown_ready = current_time + cooldown_ms;
        // No event needed - rotation will check cooldown_ready
    }

    // Apply GCD and schedule next check (apply haste to base GCD)
    // Use paperdoll cache for haste multiplier
    let gcd_ms = spell_state.gcd_ms;
    let hasted_gcd_ms = if gcd_ms > 0 {
        // Apply haste: gcd_ms / haste_mult, with 750ms minimum
        ((gcd_ms as f32 / state.player.paperdoll.cache.haste_mult) as u32).max(750)
    } else {
        0
    };

    if hasted_gcd_ms > 0 {
        state.player.gcd_ready = current_time + hasted_gcd_ms;
        if !state.player.gcd_event_pending {
            state
                .events
                .push(state.player.gcd_ready, SimEvent::GcdReady);
            state.player.gcd_event_pending = true;
        }
    } else {
        // Off-GCD spell - immediately try to cast another
        // Use push_immediate to avoid heap operation if possible
        if !state.player.gcd_event_pending {
            state
                .events
                .push_immediate(current_time, SimEvent::GcdReady);
            state.player.gcd_event_pending = true;
        }
    }

    // Calculate and record damage inline
    let damage = calculate_damage_inline(state, config, spell_idx, rng);

    // Log the cast if action logging is enabled
    if state.action_log.enabled {
        let spell_id = config.spells[spell_idx].id;
        state.action_log.log_cast(
            current_time,
            spell_idx,
            spell_id,
            damage,
            state.player.resources.current,
            hasted_gcd_ms,
        );
    }
}

/// Calculate damage for a spell - inlined with all multipliers.
/// Returns the damage dealt for logging purposes.
///
/// Uses paperdoll.cache for all stat lookups:
/// - cache.attack_power: Total attack power including buffs
/// - cache.crit_mult: 1.0 + crit_chance (expected crit damage multiplier)
/// - cache.damage_multiplier: (1 + vers) * (1 + aura_damage_pct)
#[inline(always)]
fn calculate_damage_inline(
    state: &mut SimState,
    config: &SimConfig,
    spell_idx: usize,
    _rng: &mut FastRng,
) -> f32 {
    let spell_rt = &state.spell_runtime[spell_idx];
    let cache = &state.player.paperdoll.cache;

    // Expected base damage (midpoint of range)
    let base_damage = (spell_rt.damage_min + spell_rt.damage_max) * 0.5;

    // Attack power contribution (use pre-computed ap_coefficient)
    let ap_damage = spell_rt.ap_coefficient * cache.attack_power;

    // Total damage with:
    // - cache.crit_mult = 1 + crit_chance (expected crit damage for 2x crit)
    // - cache.damage_multiplier = (1 + vers) * (1 + aura_damage_pct)
    let total_damage = (base_damage + ap_damage) * cache.crit_mult * cache.damage_multiplier;

    // Record damage
    state.results.record_damage(spell_idx, total_damage);
    state.target.health -= total_damage;
    state.results.record_cast();

    // Process spell effects (apply auras, trigger spells, etc.)
    process_spell_effects_inline(state, config, spell_idx);

    total_damage
}

/// Process spell effects - apply auras, trigger spells, etc.
/// Uses pre-resolved aura indices (no more linear search per cast)
#[inline(always)]
fn process_spell_effects_inline(state: &mut SimState, config: &SimConfig, spell_idx: usize) {
    // Copy values to avoid borrow conflict
    let apply_aura_count = state.spell_runtime[spell_idx].apply_aura_count;
    let apply_aura_indices = state.spell_runtime[spell_idx].apply_aura_indices;
    let energize_amount = state.spell_runtime[spell_idx].energize_amount;

    // Apply pre-resolved auras directly (no event queue round-trip)
    for &aura_idx in apply_aura_indices.iter().take(apply_aura_count as usize) {
        apply_aura_inline(state, config, aura_idx);
    }

    // Apply pre-computed energize effect
    if energize_amount > 0.0 {
        state.player.resources.gain(energize_amount);
    }
}

/// Apply an aura directly (inlined, no event queue)
#[inline(always)]
fn apply_aura_inline(state: &mut SimState, config: &SimConfig, aura_idx: u8) {
    let idx = aura_idx as usize;

    if idx >= config.auras.len() {
        return;
    }

    let aura_def = &config.auras[idx];
    let runtime = &state.aura_runtime[idx];

    // Check if this is a refresh (aura already active with remaining time)
    let is_refresh = state.player.auras.remaining_slot(idx, state.time) > 0;

    // Apply using slot index - O(1)
    state
        .player
        .auras
        .apply_slot(idx, runtime.duration_ms, aura_def.max_stacks, state.time);

    // Get stack count after application for logging
    let stacks = state.player.auras.stacks_slot(idx);

    // Log aura application if action logging is enabled
    if state.action_log.enabled {
        state.action_log.log_aura_apply(state.time, idx, aura_def.id, stacks, is_refresh);
    }

    // Start DoT tracking if periodic (only on NEW application, not refresh)
    // Refresh extends duration but existing tick schedule continues
    if runtime.tick_interval_ms > 0 && !is_refresh {
        state
            .player
            .auras
            .start_dot(idx, state.time + runtime.tick_interval_ms);
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

    // Check all spells for next available time
    for idx in 0..state.spell_runtime.len() {
        let spell_rt = &state.spell_runtime[idx];
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
    if max_charges > 0 && spell_state.charges < max_charges {
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

    // Trigger rotation check if not on GCD and no pending event
    if state.player.gcd_ready <= state.time && !state.player.gcd_event_pending {
        state.events.push_immediate(state.time, SimEvent::GcdReady);
        state.player.gcd_event_pending = true;
    }
}
