use wowlab_common::types::{AuraIdx, ProcIdx, SpellIdx};

// ============================================================================
// Spell IDs
// ============================================================================

/// Aimed Shot - Primary spender
pub const AIMED_SHOT: SpellIdx = SpellIdx(19434);
/// Rapid Fire - Channel dealing multiple hits
pub const RAPID_FIRE: SpellIdx = SpellIdx(257044);
/// Steady Shot - Focus generator
pub const STEADY_SHOT: SpellIdx = SpellIdx(56641);
/// Arcane Shot - Instant filler
pub const ARCANE_SHOT: SpellIdx = SpellIdx(185358);
/// Kill Shot - Execute ability (shared)
pub const KILL_SHOT: SpellIdx = SpellIdx(53351);
/// Trueshot - Major cooldown
pub const TRUESHOT: SpellIdx = SpellIdx(288613);
/// Multi-Shot - AoE ability
pub const MULTI_SHOT: SpellIdx = SpellIdx(257620);
/// Volley - AoE talent
pub const VOLLEY: SpellIdx = SpellIdx(260243);

// ============================================================================
// Aura IDs
// ============================================================================

/// Trueshot buff
pub const TRUESHOT_BUFF: AuraIdx = AuraIdx(288613);
/// Precise Shots - Arcane Shot/Multi-Shot damage buff from Aimed Shot
pub const PRECISE_SHOTS: AuraIdx = AuraIdx(260242);
/// Steady Focus - Haste buff from consecutive Steady Shots
pub const STEADY_FOCUS: AuraIdx = AuraIdx(193534);
/// Lone Wolf - Damage buff when no pet
pub const LONE_WOLF: AuraIdx = AuraIdx(164273);
/// Lock and Load - Free Aimed Shot proc
pub const LOCK_AND_LOAD: AuraIdx = AuraIdx(194594);
/// Trick Shots - AoE ricochet buff
pub const TRICK_SHOTS: AuraIdx = AuraIdx(257621);
/// Volley buff
pub const VOLLEY_BUFF: AuraIdx = AuraIdx(260243);
/// Deathblow - Kill Shot proc below 20%
pub const DEATHBLOW: AuraIdx = AuraIdx(378769);

// ============================================================================
// Proc IDs
// ============================================================================

/// Lock and Load proc
pub const LOCK_AND_LOAD_PROC: ProcIdx = ProcIdx(10);

// ============================================================================
// Tuning Constants
// ============================================================================

/// Aimed Shot focus cost
pub const AIMED_SHOT_COST: f32 = 35.0;
/// Aimed Shot AP coefficient
pub const AIMED_SHOT_AP_COEF: f32 = 2.8;
/// Aimed Shot cast time (ms)
pub const AIMED_SHOT_CAST_TIME: u32 = 2500;
/// Aimed Shot cooldown (seconds)
pub const AIMED_SHOT_COOLDOWN: f32 = 12.0;

/// Rapid Fire channel duration (ms)
pub const RAPID_FIRE_DURATION: u32 = 2000;
/// Rapid Fire ticks
pub const RAPID_FIRE_TICKS: u8 = 7;
/// Rapid Fire cooldown (seconds)
pub const RAPID_FIRE_COOLDOWN: f32 = 20.0;
/// Rapid Fire AP coefficient per tick
pub const RAPID_FIRE_AP_COEF: f32 = 0.35;

/// Steady Shot focus cost (negative = generator)
pub const STEADY_SHOT_COST: f32 = 0.0;
/// Steady Shot focus generated
pub const STEADY_SHOT_FOCUS_GAIN: f32 = 10.0;
/// Steady Shot AP coefficient
pub const STEADY_SHOT_AP_COEF: f32 = 0.25;
/// Steady Shot cast time (ms)
pub const STEADY_SHOT_CAST_TIME: u32 = 1800;

/// Arcane Shot focus cost
pub const ARCANE_SHOT_COST: f32 = 20.0;
/// Arcane Shot AP coefficient
pub const ARCANE_SHOT_AP_COEF: f32 = 0.45;

/// Trueshot duration (seconds)
pub const TRUESHOT_DURATION: f32 = 15.0;
/// Trueshot cooldown (seconds)
pub const TRUESHOT_COOLDOWN: f32 = 120.0;
/// Trueshot haste bonus
pub const TRUESHOT_HASTE: f32 = 0.50;
/// Trueshot crit bonus
pub const TRUESHOT_CRIT: f32 = 0.20;

/// Precise Shots duration (seconds)
pub const PRECISE_SHOTS_DURATION: f32 = 15.0;
/// Precise Shots max stacks
pub const PRECISE_SHOTS_STACKS: u8 = 2;
/// Precise Shots damage multiplier
pub const PRECISE_SHOTS_DAMAGE: f32 = 0.75;

/// Steady Focus duration (seconds)
pub const STEADY_FOCUS_DURATION: f32 = 15.0;
/// Steady Focus haste bonus
pub const STEADY_FOCUS_HASTE: f32 = 0.07;

/// Lone Wolf damage bonus
pub const LONE_WOLF_DAMAGE: f32 = 0.10;

/// Lock and Load proc chance
pub const LOCK_AND_LOAD_CHANCE: f32 = 0.08;

/// Multi-Shot focus cost
pub const MULTI_SHOT_COST: f32 = 20.0;
/// Multi-Shot AP coefficient
pub const MULTI_SHOT_AP_COEF: f32 = 0.40;

// ============================================================================
// Talent Flags
// ============================================================================

bitflags::bitflags! {
    /// MM Hunter talent flags
    #[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
    pub struct TalentFlags: u64 {
        const TRUESHOT = 1 << 0;
        const LOCK_AND_LOAD = 1 << 1;
        const STEADY_FOCUS = 1 << 2;
        const TRICK_SHOTS = 1 << 3;
        const VOLLEY = 1 << 4;
    }
}
