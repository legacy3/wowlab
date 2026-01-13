//! Runtime context for JIT-compiled rotations.
//!
//! The `RotationContext` struct has a fixed memory layout (#[repr(C)]) that
//! the Cranelift-compiled code reads from directly via pointer offsets.

use crate::sim::SimState;
use crate::types::{AuraIdx, SpellIdx};

/// Runtime context passed to compiled rotation.
///
/// This struct is laid out for direct memory access from JIT code.
/// All f64 fields first, then i32, then bool for alignment.
#[repr(C)]
#[derive(Debug, Clone, Default)]
pub struct RotationContext {
    // === f64 fields (8 bytes each) ===
    pub focus: f64,
    pub focus_max: f64,
    pub time: f64,
    pub gcd_remains: f64,
    pub target_health_pct: f64,
    pub target_time_to_die: f64,

    // === Cooldown slots (indexed by slot number, not spell ID) ===
    // Up to 16 cooldown slots for common spells
    pub cd_remains: [f64; 16],

    // === Buff slots ===
    pub buff_remains: [f64; 16],

    // === i32 fields ===
    pub target_count: i32,
    pub cd_charges: [i32; 16],
    pub buff_stacks: [i32; 16],

    // === bool fields (1 byte each) ===
    pub cd_ready: [bool; 16],
    pub buff_active: [bool; 16],
    pub pet_active: bool,
}

/// Trait for building RotationContext from SimState.
///
/// Each spec implements this to map their spells/auras to context slots.
pub trait ContextBuilder: Send + Sync {
    /// Build rotation context from current simulation state.
    fn build_context(&self, state: &SimState) -> RotationContext;

    /// Map a spell to a cooldown slot index (0-15).
    fn cooldown_slot(&self, spell: SpellIdx) -> Option<usize>;

    /// Map an aura to a buff slot index (0-15).
    fn buff_slot(&self, aura: AuraIdx) -> Option<usize>;
}

impl RotationContext {
    /// Create a new empty context.
    pub fn new() -> Self {
        Self::default()
    }

    /// Populate base fields from SimState.
    pub fn from_sim_state(state: &SimState) -> Self {
        let now = state.now();
        let mut ctx = Self::new();

        // Resources
        if let Some(ref primary) = state.player.resources.primary {
            ctx.focus = primary.current as f64;
            ctx.focus_max = primary.max as f64;
        }

        // Time
        ctx.time = now.as_secs_f32() as f64;
        ctx.gcd_remains = state.player.gcd_remaining(now).as_secs_f32() as f64;

        // Target
        if let Some(enemy) = state.enemies.primary() {
            ctx.target_health_pct = (enemy.health_percent() * 100.0) as f64;
            // TODO: Proper TTD calculation
            ctx.target_time_to_die = state.remaining().as_secs_f32() as f64;
        }
        ctx.target_count = state.enemies.alive_count() as i32;

        // Pet
        ctx.pet_active = state.pets.active_count(now) > 0;

        ctx
    }
}
