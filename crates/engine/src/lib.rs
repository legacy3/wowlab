use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

/// Spell static data (from game database)
#[derive(Clone, Copy, Debug, Deserialize)]
pub struct SpellInfo {
    pub id: u32,
    pub cooldown: f32,
    pub gcd: f32,
    pub cast_time: f32,
    pub charges: u8,
}

/// Runtime spell state (changes during sim)
#[derive(Clone, Copy, Debug, Default)]
pub struct SpellState {
    pub cooldown_ready: f32,
    pub charges: u8,
}

/// Player resources
#[derive(Clone, Copy, Debug, Default, Deserialize)]
pub struct Resources {
    pub focus: f32,
    pub focus_max: f32,
    pub focus_regen: f32,
}

/// Simulation configuration (passed from JS)
#[derive(Debug, Deserialize)]
pub struct SimConfig {
    pub spells: Vec<SpellInfo>,
    pub resources: Resources,
    pub duration: f32,
}

/// Simulation results (returned to JS)
#[derive(Clone, Debug, Default, Serialize)]
pub struct SimResult {
    pub damage: f64,
    pub dps: f64,
    pub casts: u32,
}

/// Batch results with statistics
#[derive(Clone, Debug, Default, Serialize)]
pub struct BatchResult {
    pub iterations: u32,
    pub mean_dps: f64,
    pub min_dps: f64,
    pub max_dps: f64,
    pub total_casts: u64,
}

/// Fast xorshift RNG
pub struct FastRng {
    state: u64,
}

impl FastRng {
    pub fn new(seed: u64) -> Self {
        Self {
            state: if seed == 0 { 1 } else { seed },
        }
    }

    #[inline]
    pub fn next(&mut self) -> u64 {
        let mut x = self.state;
        x ^= x << 13;
        x ^= x >> 7;
        x ^= x << 17;
        self.state = x;
        x
    }

    #[inline]
    pub fn next_f32(&mut self) -> f32 {
        (self.next() as f32) / (u64::MAX as f32)
    }
}

/// Main simulator exposed to WASM
#[wasm_bindgen]
pub struct Simulator {
    config: SimConfig,
    rng: FastRng,
}

#[wasm_bindgen]
impl Simulator {
    /// Create a new simulator from JSON config
    #[wasm_bindgen(constructor)]
    pub fn new(config_json: &str) -> Result<Simulator, JsValue> {
        let config: SimConfig = serde_json::from_str(config_json)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse config: {}", e)))?;

        Ok(Simulator {
            config,
            rng: FastRng::new(1),
        })
    }

    /// Run a single simulation
    pub fn run(&mut self, seed: u64) -> JsValue {
        self.rng = FastRng::new(seed);
        let result = self.run_single();
        serde_wasm_bindgen::to_value(&result).unwrap()
    }

    /// Run a batch of simulations
    pub fn run_batch(&mut self, iterations: u32, base_seed: u64) -> JsValue {
        let mut batch = BatchResult {
            iterations,
            min_dps: f64::MAX,
            ..Default::default()
        };

        for i in 0..iterations {
            self.rng = FastRng::new(base_seed.wrapping_add(i as u64));
            let result = self.run_single();

            batch.mean_dps += result.dps;
            batch.min_dps = batch.min_dps.min(result.dps);
            batch.max_dps = batch.max_dps.max(result.dps);
            batch.total_casts += result.casts as u64;
        }

        batch.mean_dps /= iterations as f64;

        serde_wasm_bindgen::to_value(&batch).unwrap()
    }
}

impl Simulator {
    /// Core simulation loop (not exposed to WASM directly)
    fn run_single(&mut self) -> SimResult {
        let mut result = SimResult::default();
        let mut time: f32 = 0.0;
        let mut spell_states: Vec<SpellState> = self
            .config
            .spells
            .iter()
            .map(|s| SpellState {
                cooldown_ready: 0.0,
                charges: s.charges,
            })
            .collect();

        let duration = self.config.duration;

        // Simple simulation loop - cast highest priority spell on GCD
        while time < duration {
            // Find first ready spell (priority order)
            let mut cast_idx: Option<usize> = None;
            for (idx, (info, state)) in self
                .config
                .spells
                .iter()
                .zip(spell_states.iter())
                .enumerate()
            {
                if state.charges > 0 || state.cooldown_ready <= time {
                    cast_idx = Some(idx);
                    break;
                }
            }

            if let Some(idx) = cast_idx {
                let info = &self.config.spells[idx];
                let state = &mut spell_states[idx];

                // Consume charge or start cooldown
                if state.charges > 0 {
                    state.charges -= 1;
                } else {
                    state.cooldown_ready = time + info.cooldown;
                }

                // Deal damage (placeholder - random 1000-2000)
                let damage = 1000.0 + self.rng.next_f32() * 1000.0;
                result.damage += damage as f64;
                result.casts += 1;

                // Advance by GCD
                time += info.gcd.max(info.cast_time);
            } else {
                // No spell ready, advance time to next ready
                let next_ready = spell_states
                    .iter()
                    .map(|s| s.cooldown_ready)
                    .fold(f32::MAX, |a, b| a.min(b));
                time = next_ready;
            }
        }

        result.dps = result.damage / duration as f64;
        result
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simulation() {
        let config = SimConfig {
            spells: vec![
                SpellInfo {
                    id: 1,
                    cooldown: 6.0,
                    gcd: 1.5,
                    cast_time: 0.0,
                    charges: 2,
                },
                SpellInfo {
                    id: 2,
                    cooldown: 0.0,
                    gcd: 1.5,
                    cast_time: 0.0,
                    charges: 0,
                },
            ],
            resources: Resources::default(),
            duration: 60.0,
        };

        let mut sim = Simulator {
            config,
            rng: FastRng::new(12345),
        };

        let result = sim.run_single();
        assert!(result.casts > 0);
        assert!(result.dps > 0.0);
        println!("Casts: {}, DPS: {:.0}", result.casts, result.dps);
    }
}
