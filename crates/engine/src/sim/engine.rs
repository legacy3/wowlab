/*
TODO:

- Use meta-events to batch all actions per game tick or logical timeframe
- Process all same-timestamp ("instant") follow-up effects inline, avoid rescheduling
- Minimize total event count: schedule only when state actually changes, not for passive delays
- For predictable periodic effects (auras, dots), bulk process them in dedicated tick handlers
- Use a single event per actor/entity per tick if possible (batch status, procs, damage, etc.)
- Preallocate event storage via bump arenas, slabs, or array pools to avoid heap alloc churn
- Switch to a d-ary (e.g., 4-ary) heap if pop/push is the true bottleneck (optional)
- Employ a "front buffer" (small fixed array/Vec) for immediate-next events for cache locality
- Combine repeated triggers or group child events under parent "bucket" events where practical
- Profile event type frequency: optimize "hot-path" (common, performance-critical) event handlers
- Inline function calls and specialize event handlers for highest-frequency event types
- Exploit Rust's tight struct packing and cache-friendly layouts for events and state
- Avoid sending/handling events for no-ops or unchanged state conditions
- Consider simulation granularity: slightly larger tick time = fewer total events (if fidelity allows)
- Use efficient match/enums for branching within event handlers
- Profile everything (esp. in WASM) and refactor based on real flamegraphs/hotspots
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

/// Run a single simulation - the core hot loop.
#[inline]
pub fn run_simulation(state: &mut SimState, config: &SimConfig, rng: &mut FastRng) -> SimResult {
    state.reset();

    // Schedule initial GCD ready (start of combat)
    state.events.push(0.0, SimEvent::GcdReady);
    state.player.gcd_event_pending = true;

    let duration = state.duration;

    // Main simulation loop - event-driven with inline processing
    while let Some(timed_event) = state.events.pop() {
        let event_time = timed_event.time;

        // Early exit if past simulation end
        if event_time > duration {
            break;
        }

        state.time = event_time;

        // Dispatch based on event type - ordered by frequency for branch prediction
        match timed_event.event {
            SimEvent::GcdReady => {
                state.player.gcd_event_pending = false;
                handle_gcd_ready_inline(state, config, rng);
            }

            SimEvent::CooldownReady { spell_idx } => {
                handle_cooldown_ready_inline(state, config, spell_idx);
            }

            SimEvent::AuraTick { aura_idx } => {
                handle_aura_tick_inline(state, config, aura_idx, rng);
            }

            SimEvent::AuraExpire { aura_idx } => {
                handle_aura_expire_inline(state, aura_idx);
            }

            SimEvent::AuraApply { aura_idx, stacks } => {
                handle_aura_apply_inline(state, config, aura_idx, stacks);
            }

            // Less frequent events - still inline but lower priority
            SimEvent::SpellDamage { spell_idx, damage_x100 } => {
                let damage = (damage_x100 as f32) / 100.0;
                state.results.record_damage(spell_idx as usize, damage as f64);
                state.target.health -= damage;
            }

            SimEvent::AutoAttack => {
                // Auto-attack handling (if implemented)
            }

            SimEvent::PetAttack => {
                // Pet attack handling (if implemented)
            }

            SimEvent::ResourceTick => {
                // Tick-based regen (unused - we use lazy regen)
            }

            SimEvent::CastComplete { spell_idx } => {
                // Cast completion for cast-time spells (unused for instant casts)
                let _ = spell_idx;
            }
        }
    }

    SimResult {
        damage: state.results.total_damage,
        dps: state.results.total_damage / duration as f64,
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
fn handle_gcd_ready_inline(state: &mut SimState, config: &SimConfig, rng: &mut FastRng) {
    let current_time = state.time;

    // Lazy resource regeneration - only compute when needed
    let elapsed = current_time - state.player.last_resource_update;
    if elapsed > 0.0 {
        state.player.resources.regen(elapsed);
        state.player.last_resource_update = current_time;
    }

    // Inline rotation evaluation - find first castable spell
    let spell_idx = find_castable_spell_inline(state, config, current_time);

    if let Some(idx) = spell_idx {
        // Cast the spell inline
        cast_spell_inline(state, config, idx, rng, current_time);
    } else {
        // No spell available - compute next wake-up time
        schedule_next_opportunity_inline(state, config, current_time);
    }
}

/// Find the first castable spell - inlined rotation evaluation.
#[inline(always)]
fn find_castable_spell_inline(state: &SimState, config: &SimConfig, current_time: f32) -> Option<usize> {
    let player = &state.player;
    let gcd_ready = player.gcd_ready <= current_time;
    let current_resource = player.resources.current;

    // Fast path: if GCD not ready, nothing is castable
    if !gcd_ready {
        return None;
    }

    // Iterate through spells in priority order
    for (idx, spell) in config.spells.iter().enumerate() {
        let spell_state = &player.spell_states[idx];

        // Check cooldown/charges - most common rejection
        let cd_ready = spell_state.charges > 0 || spell_state.cooldown_ready <= current_time;
        if !cd_ready {
            continue;
        }

        // Check resources
        if current_resource < spell.cost.amount {
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
    config: &SimConfig,
    spell_idx: usize,
    rng: &mut FastRng,
    current_time: f32,
) {
    let spell = &config.spells[spell_idx];
    let spell_state = &mut state.player.spell_states[spell_idx];

    // Consume resources
    state.player.resources.spend(spell.cost.amount);

    // Handle cooldown/charges
    if spell.charges > 0 {
        // Charge-based spell
        spell_state.charges -= 1;

        // Start recharge if we just went below max
        if spell_state.charges == spell.charges - 1 {
            spell_state.cooldown_ready = current_time + spell.cooldown;
            state.events.push(
                spell_state.cooldown_ready,
                SimEvent::CooldownReady { spell_idx: spell_idx as u8 },
            );
        }
    } else if spell.cooldown > 0.0 {
        // Regular cooldown spell
        spell_state.cooldown_ready = current_time + spell.cooldown;
        // No event needed - rotation will check cooldown_ready
    }

    // Apply GCD and schedule next check
    let gcd = if spell.gcd > 0.0 {
        state.player.stats.gcd(spell.gcd)
    } else {
        0.0
    };

    if gcd > 0.0 {
        state.player.gcd_ready = current_time + gcd;
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
    calculate_damage_inline(state, config, spell_idx, rng);
}

/// Calculate damage for a spell - inlined with all multipliers.
#[inline(always)]
fn calculate_damage_inline(
    state: &mut SimState,
    config: &SimConfig,
    spell_idx: usize,
    rng: &mut FastRng,
) {
    let spell = &config.spells[spell_idx];
    let stats = &state.player.stats;

    // Base damage roll
    let base_damage = rng.range_f32(spell.damage.base_min, spell.damage.base_max);

    // Attack power contribution
    let ap_damage = spell.damage.ap_coefficient * stats.attack_power();

    // Total base damage
    let mut total_damage = base_damage + ap_damage;

    // Critical strike
    if rng.roll(stats.crit_pct / 100.0) {
        total_damage *= 2.0;
    }

    // Versatility
    total_damage *= 1.0 + stats.versatility_pct / 100.0;

    // Record damage
    state.results.record_damage(spell_idx, total_damage as f64);
    state.target.health -= total_damage;
    state.results.record_cast();
}

/// Schedule next opportunity when no spell is castable.
/// Computes the earliest time any spell becomes available.
#[inline]
fn schedule_next_opportunity_inline(state: &mut SimState, config: &SimConfig, current_time: f32) {
    if state.player.gcd_event_pending {
        return;
    }

    let duration = state.duration;
    let mut next_time = f32::MAX;

    let player = &state.player;
    let regen_rate = player.resources.regen_per_second;
    let current_resource = player.resources.current;

    for (idx, spell) in config.spells.iter().enumerate() {
        let spell_state = &player.spell_states[idx];

        // Cooldown ready time
        let cd_ready_time = if spell_state.charges > 0 {
            current_time
        } else {
            spell_state.cooldown_ready
        };

        // Resource ready time
        let resource_ready_time = if current_resource >= spell.cost.amount {
            current_time
        } else if regen_rate > 0.0 {
            let needed = spell.cost.amount - current_resource;
            current_time + needed / regen_rate
        } else {
            f32::MAX
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
fn handle_cooldown_ready_inline(state: &mut SimState, config: &SimConfig, spell_idx: u8) {
    let idx = spell_idx as usize;
    let spell = &config.spells[idx];

    // Only charge-based spells trigger this event
    if spell.charges > 0 {
        let spell_state = &mut state.player.spell_states[idx];

        if spell_state.charges < spell.charges {
            spell_state.charges += 1;

            // Schedule next charge if not at max
            if spell_state.charges < spell.charges {
                spell_state.cooldown_ready = state.time + spell.cooldown;
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
    config: &SimConfig,
    aura_idx: u8,
    rng: &mut FastRng,
) {
    let idx = aura_idx as usize;

    // Check if aura is still active
    if idx >= config.auras.len() {
        return;
    }

    let aura_def = &config.auras[idx];

    // Check if aura is still on the target/player
    if !state.player.auras.has(aura_def.id) {
        return;
    }

    // Process tick effects (damage/healing)
    for effect in &aura_def.effects {
        match effect {
            crate::config::AuraEffect::PeriodicDamage { amount, coefficient } => {
                let ap = state.player.stats.attack_power();
                let damage = amount + coefficient * ap;

                // Apply crit
                let damage = if rng.roll(state.player.stats.crit_pct / 100.0) {
                    damage * 2.0
                } else {
                    damage
                };

                // Apply versatility
                let damage = damage * (1.0 + state.player.stats.versatility_pct / 100.0);

                state.results.total_damage += damage as f64;
                state.target.health -= damage;
            }
            _ => {}
        }
    }

    // Schedule next tick if aura still has duration remaining
    let remaining = state.player.auras.remaining(aura_def.id, state.time);
    if remaining > 0.0 && aura_def.tick_interval > 0.0 {
        let next_tick = state.time + aura_def.tick_interval;
        if next_tick < state.time + remaining {
            state.events.push(next_tick, SimEvent::AuraTick { aura_idx });
        }
    }
}

/// Handle aura expiration.
#[inline(always)]
fn handle_aura_expire_inline(state: &mut SimState, aura_idx: u8) {
    // Remove by index - we need to find the aura_id
    // For now, aura_idx maps to config.auras[idx].id
    // This is a simplification - in practice we might store aura_id directly
    let _ = aura_idx;
    // Actual removal would be: state.player.auras.remove(aura_id);
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

    state.player.auras.apply(
        aura_def.id,
        aura_def.duration,
        aura_def.max_stacks,
        state.time,
    );

    // Schedule expiration
    state.events.push(
        state.time + aura_def.duration,
        SimEvent::AuraExpire { aura_idx },
    );

    // Schedule first tick if DoT/HoT
    if aura_def.tick_interval > 0.0 {
        state.events.push(
            state.time + aura_def.tick_interval,
            SimEvent::AuraTick { aura_idx },
        );
    }

    let _ = stacks;
}
