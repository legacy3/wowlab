use crate::config::SimConfig;
use crate::util::FastRng;

use super::{BatchAccumulator, BatchResult, SimEvent, SimResult, SimState};

/// Run a single simulation
pub fn run_simulation(state: &mut SimState, config: &SimConfig, rng: &mut FastRng) -> SimResult {
    state.reset();

    // Schedule initial events
    state.events.push(0.0, SimEvent::GcdReady);
    state.events.push(0.0, SimEvent::ResourceTick);

    // Main simulation loop
    while let Some(timed_event) = state.events.pop() {
        if timed_event.time > state.duration {
            break;
        }

        state.time = timed_event.time;

        match timed_event.event {
            SimEvent::GcdReady => {
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
            SimEvent::ResourceTick => {
                handle_resource_tick(state);
            }
            _ => {
                // TODO: handle other events
            }
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
    // Evaluate rotation and try to cast
    if let Some(spell_idx) = evaluate_rotation(state, config) {
        cast_spell(state, config, spell_idx, rng);
    } else {
        // No spell to cast, check again next tick
        state.events.push(state.time + 0.1, SimEvent::GcdReady);
    }
}

fn evaluate_rotation(state: &SimState, config: &SimConfig) -> Option<usize> {
    // Simple priority: cast first spell that's ready
    // TODO: implement proper condition evaluation from rotation config
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

fn cast_spell(state: &mut SimState, config: &SimConfig, spell_idx: usize, rng: &mut FastRng) {
    let spell = &config.spells[spell_idx];
    let spell_state = &mut state.player.spell_states[spell_idx];

    // Consume resources
    state.player.resources.spend(spell.cost.amount);

    // Consume charge or start cooldown
    if spell_state.charges > 0 {
        spell_state.charges -= 1;
        // Start cooldown if this was the last charge
        if spell_state.charges == spell_state.max_charges - 1 {
            spell_state.cooldown_ready = state.time + spell.cooldown;
        }
    } else {
        spell_state.cooldown_ready = state.time + spell.cooldown;
    }

    // Apply GCD
    let gcd = state.player.stats.gcd(spell.gcd);
    state.player.gcd_ready = state.time + gcd;

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

    // Schedule damage event
    state
        .events
        .push(state.time, SimEvent::SpellDamage {
            spell_id: spell.id,
            amount: damage,
        });

    // Schedule next GCD
    state.events.push(state.time + gcd, SimEvent::GcdReady);

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

        // Schedule expiration
        state.events.push(
            state.time + aura_def.duration,
            SimEvent::AuraExpire { aura_id },
        );
    }
}

fn handle_aura_expire(state: &mut SimState, aura_id: u32) {
    state.player.auras.remove(aura_id);
}

fn handle_resource_tick(state: &mut SimState) {
    // Regen resources
    state.player.resources.regen(0.1);

    // Schedule next tick
    if state.time + 0.1 <= state.duration {
        state.events.push(state.time + 0.1, SimEvent::ResourceTick);
    }
}
