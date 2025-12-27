use crate::config::SimConfig;
use crate::util::FastRng;

use super::{BatchAccumulator, BatchResult, SimEvent, SimResult, SimState};

/// Run a single simulation
pub fn run_simulation(state: &mut SimState, config: &SimConfig, rng: &mut FastRng) -> SimResult {
    state.reset();

    // Schedule initial GCD ready (start of combat)
    state.events.push(0.0, SimEvent::GcdReady);
    state.player.gcd_event_pending = true;

    // Main simulation loop - pure event driven
    while let Some(timed_event) = state.events.pop() {
        if timed_event.time > state.duration {
            break;
        }

        state.time = timed_event.time;

        match timed_event.event {
            SimEvent::GcdReady => {
                state.player.gcd_event_pending = false;
                handle_gcd_ready(state, config, rng);
            }
            SimEvent::SpellDamage { spell_id, amount } => {
                handle_spell_damage(state, spell_id, amount);
            }
            SimEvent::AuraApply { aura_id, stacks } => {
                handle_aura_apply(state, config, aura_id, stacks);
            }
            SimEvent::AuraExpire { aura_id } => {
                handle_aura_expire(state, aura_id);
            }
            SimEvent::CooldownReady { spell_id } => {
                handle_cooldown_ready(state, config, spell_id);
            }
            _ => {}
        }
    }

    SimResult {
        damage: state.results.total_damage,
        dps: state.results.total_damage / state.duration as f64,
        casts: state.results.cast_count,
    }
}

/// Run a batch of simulations
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
        accum.add(&result, &state.results.spell_damage);
    }

    accum.finalize(config.duration)
}

fn handle_gcd_ready(state: &mut SimState, config: &SimConfig, rng: &mut FastRng) {
    // Update resources based on time elapsed (lazy regen)
    let elapsed = state.time - state.player.last_resource_update;
    if elapsed > 0.0 {
        state.player.resources.regen(elapsed);
        state.player.last_resource_update = state.time;
    }

    // Try to cast a spell
    if let Some(spell_idx) = evaluate_rotation(state, config) {
        cast_spell(state, config, spell_idx, rng);
    } else {
        // No spell available - schedule wake up when something changes
        schedule_next_opportunity(state, config);
    }
}

fn handle_cooldown_ready(state: &mut SimState, config: &SimConfig, spell_id: u32) {
    // A cooldown finished - if we're not on GCD and no event pending, schedule check
    if state.player.gcd_ready <= state.time && !state.player.gcd_event_pending {
        // Schedule immediate GCD check
        state.events.push(state.time, SimEvent::GcdReady);
        state.player.gcd_event_pending = true;
    }

    // Update charge if this is a charge-based spell
    for (idx, spell) in config.spells.iter().enumerate() {
        if spell.id == spell_id && spell.charges > 0 {
            let spell_state = &mut state.player.spell_states[idx];
            if spell_state.charges < spell.charges {
                spell_state.charges += 1;
                // Schedule next charge if not at max
                if spell_state.charges < spell.charges {
                    spell_state.cooldown_ready = state.time + spell.cooldown;
                    state.events.push(
                        spell_state.cooldown_ready,
                        SimEvent::CooldownReady { spell_id },
                    );
                }
            }
            break;
        }
    }
}

fn evaluate_rotation(state: &SimState, config: &SimConfig) -> Option<usize> {
    // Simple priority: cast first spell that's ready
    for (idx, spell) in config.spells.iter().enumerate() {
        let spell_state = &state.player.spell_states[idx];

        // Check if spell is castable
        let cd_ready = spell_state.charges > 0 || spell_state.cooldown_ready <= state.time;
        let gcd_ready = state.player.gcd_ready <= state.time;
        let has_resources = state.player.resources.current >= spell.cost.amount;

        if cd_ready && gcd_ready && has_resources {
            return Some(idx);
        }
    }

    None
}

/// Schedule the next opportunity to cast when we can't cast now
fn schedule_next_opportunity(state: &mut SimState, config: &SimConfig) {
    if state.player.gcd_event_pending {
        return; // Already have an event scheduled
    }

    let mut next_time = f32::MAX;

    for (idx, spell) in config.spells.iter().enumerate() {
        let spell_state = &state.player.spell_states[idx];

        // When will this spell be castable?
        let cd_ready_time = if spell_state.charges > 0 {
            state.time
        } else {
            spell_state.cooldown_ready
        };

        // When will we have enough resources?
        let resource_ready_time = if state.player.resources.current >= spell.cost.amount {
            state.time
        } else if state.player.resources.regen_per_second > 0.0 {
            let needed = spell.cost.amount - state.player.resources.current;
            state.time + needed / state.player.resources.regen_per_second
        } else {
            f32::MAX
        };

        // The spell becomes castable at the later of cd/resource ready
        let spell_ready = cd_ready_time.max(resource_ready_time);

        if spell_ready < next_time {
            next_time = spell_ready;
        }
    }

    // Also consider GCD
    next_time = next_time.max(state.player.gcd_ready);

    // Schedule next check if within sim duration
    if next_time < state.duration && next_time > state.time {
        state.events.push(next_time, SimEvent::GcdReady);
        state.player.gcd_event_pending = true;
    }
}

fn cast_spell(state: &mut SimState, config: &SimConfig, spell_idx: usize, rng: &mut FastRng) {
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
            spell_state.cooldown_ready = state.time + spell.cooldown;
            state.events.push(
                spell_state.cooldown_ready,
                SimEvent::CooldownReady { spell_id: spell.id },
            );
        }
    } else if spell.cooldown > 0.0 {
        // Regular cooldown spell
        spell_state.cooldown_ready = state.time + spell.cooldown;
        // No need to schedule CooldownReady for non-charge spells
        // The next GcdReady will check if it's available
    }

    // Apply GCD
    let gcd = if spell.gcd > 0.0 {
        state.player.stats.gcd(spell.gcd)
    } else {
        0.0
    };

    if gcd > 0.0 {
        state.player.gcd_ready = state.time + gcd;
        // Schedule next GCD ready if not already pending
        if !state.player.gcd_event_pending {
            state.events.push(state.player.gcd_ready, SimEvent::GcdReady);
            state.player.gcd_event_pending = true;
        }
    }

    // Calculate damage
    let base_damage = rng.range_f32(spell.damage.base_min, spell.damage.base_max);
    let ap_damage = spell.damage.ap_coefficient * state.player.stats.attack_power();
    let total_damage = base_damage + ap_damage;

    // Apply crit
    let is_crit = rng.roll(state.player.stats.crit_pct / 100.0);
    let damage = if is_crit {
        total_damage * 2.0
    } else {
        total_damage
    };

    // Apply versatility
    let damage = damage * (1.0 + state.player.stats.versatility_pct / 100.0);

    // Record damage immediately (no need to schedule for instant spells)
    state.results.record_damage(spell.id, damage as f64);
    state.target.health -= damage;
    state.results.record_cast();
}

fn handle_spell_damage(state: &mut SimState, spell_id: u32, amount: f32) {
    state.results.record_damage(spell_id, amount as f64);
    state.target.health -= amount;
}

fn handle_aura_apply(state: &mut SimState, config: &SimConfig, aura_id: u32, _stacks: u8) {
    if let Some(aura_def) = config.auras.iter().find(|a| a.id == aura_id) {
        state.player.auras.apply(
            aura_id,
            aura_def.duration,
            aura_def.max_stacks,
            state.time,
        );

        state.events.push(
            state.time + aura_def.duration,
            SimEvent::AuraExpire { aura_id },
        );
    }
}

fn handle_aura_expire(state: &mut SimState, aura_id: u32) {
    state.player.auras.remove(aura_id);
}
