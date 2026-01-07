//! Game state representation for benchmarks

use crate::{SpellId, AuraId};

/// Compact game state for rotation evaluation
/// Designed to fit in cache
#[repr(C)]
#[derive(Clone, Debug)]
pub struct GameState {
    // Resources (primary)
    pub focus: f32,
    pub focus_max: f32,

    // Target
    pub target_health_pct: f32,
    pub enemy_count: u8,

    // Cooldowns (remaining seconds, 0.0 = ready)
    pub cooldowns: [f32; 8],

    // Cooldown charges
    pub charges: [u8; 8],
    pub max_charges: [u8; 8],

    // Aura remaining (seconds)
    pub aura_remaining: [f32; 8],

    // Aura stacks
    pub aura_stacks: [u8; 8],

    // GCD remaining
    pub gcd_remaining: f32,

    // Combat state
    pub in_combat: bool,
    pub time_in_combat: f32,
}

impl GameState {
    pub fn new() -> Self {
        Self {
            focus: 100.0,
            focus_max: 120.0,
            target_health_pct: 1.0,
            enemy_count: 1,
            cooldowns: [0.0; 8],
            charges: [2, 0, 2, 0, 0, 0, 0, 0], // barbed shot has charges
            max_charges: [2, 0, 2, 0, 0, 0, 0, 0],
            aura_remaining: [0.0; 8],
            aura_stacks: [0; 8],
            gcd_remaining: 0.0,
            in_combat: true,
            time_in_combat: 10.0,
        }
    }

    /// Generate random state for benchmarking
    pub fn random(rng: &mut impl rand::Rng) -> Self {
        use rand::Rng;

        Self {
            focus: rng.gen_range(0.0..120.0),
            focus_max: 120.0,
            target_health_pct: rng.gen_range(0.0..1.0),
            enemy_count: rng.gen_range(1..5),
            cooldowns: [
                rng.gen_range(0.0..15.0), // bestial wrath
                rng.gen_range(0.0..7.5),  // kill command
                rng.gen_range(0.0..12.0), // barbed shot
                0.0,                       // cobra shot (no cd)
                rng.gen_range(0.0..10.0), // kill shot
                rng.gen_range(0.0..20.0), // dire beast
                rng.gen_range(0.0..120.0), // call of the wild
                0.0,
            ],
            charges: [
                0,
                0,
                rng.gen_range(0..3),  // barbed shot charges
                0,
                0,
                0,
                0,
                0,
            ],
            max_charges: [0, 0, 2, 0, 0, 0, 0, 0],
            aura_remaining: [
                if rng.gen_bool(0.3) { rng.gen_range(0.0..15.0) } else { 0.0 }, // bestial wrath
                if rng.gen_bool(0.7) { rng.gen_range(0.0..8.0) } else { 0.0 },  // frenzy
                if rng.gen_bool(0.1) { rng.gen_range(0.0..20.0) } else { 0.0 }, // call of the wild
                0.0, 0.0, 0.0, 0.0, 0.0,
            ],
            aura_stacks: [
                0,
                rng.gen_range(0..4), // frenzy stacks
                0, 0, 0, 0, 0, 0,
            ],
            gcd_remaining: 0.0,
            in_combat: true,
            time_in_combat: rng.gen_range(0.0..300.0),
        }
    }

    // Helper methods for accessing state

    #[inline]
    pub fn cooldown_ready(&self, spell: SpellId) -> bool {
        self.cooldowns[spell.0 as usize] <= 0.0
    }

    #[inline]
    pub fn cooldown_remaining(&self, spell: SpellId) -> f32 {
        self.cooldowns[spell.0 as usize]
    }

    #[inline]
    pub fn has_charge(&self, spell: SpellId) -> bool {
        self.charges[spell.0 as usize] > 0
    }

    #[inline]
    pub fn charge_count(&self, spell: SpellId) -> u8 {
        self.charges[spell.0 as usize]
    }

    #[inline]
    pub fn aura_active(&self, aura: AuraId) -> bool {
        self.aura_remaining[aura.0 as usize] > 0.0
    }

    #[inline]
    pub fn aura_remaining(&self, aura: AuraId) -> f32 {
        self.aura_remaining[aura.0 as usize]
    }

    #[inline]
    pub fn aura_stacks(&self, aura: AuraId) -> u8 {
        self.aura_stacks[aura.0 as usize]
    }

    #[inline]
    pub fn execute_phase(&self) -> bool {
        self.target_health_pct < 0.20
    }
}

impl Default for GameState {
    fn default() -> Self {
        Self::new()
    }
}
