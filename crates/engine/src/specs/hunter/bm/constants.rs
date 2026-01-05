use crate::types::{SpellIdx, AuraIdx, ProcIdx};

// ============================================================================
// Spell IDs
// ============================================================================

/// Kill Command
pub const KILL_COMMAND: SpellIdx = SpellIdx(34026);
/// Cobra Shot
pub const COBRA_SHOT: SpellIdx = SpellIdx(193455);
/// Barbed Shot
pub const BARBED_SHOT: SpellIdx = SpellIdx(217200);
/// Bestial Wrath
pub const BESTIAL_WRATH: SpellIdx = SpellIdx(19574);
/// Multi-Shot
pub const MULTI_SHOT: SpellIdx = SpellIdx(2643);
/// Beast Cleave
pub const BEAST_CLEAVE_SPELL: SpellIdx = SpellIdx(115939);
/// Kill Shot
pub const KILL_SHOT: SpellIdx = SpellIdx(53351);
/// A Murder of Crows
pub const MURDER_OF_CROWS: SpellIdx = SpellIdx(131894);
/// Bloodshed
pub const BLOODSHED: SpellIdx = SpellIdx(321530);
/// Call of the Wild
pub const CALL_OF_THE_WILD: SpellIdx = SpellIdx(359844);

// Pet abilities
/// Pet auto-attack
pub const PET_MELEE: SpellIdx = SpellIdx(100001);
/// Pet Kill Command damage
pub const PET_KILL_COMMAND: SpellIdx = SpellIdx(100002);
/// Pet Stomp
pub const PET_STOMP: SpellIdx = SpellIdx(201754);

// ============================================================================
// Aura IDs
// ============================================================================

/// Bestial Wrath buff
pub const BESTIAL_WRATH_BUFF: AuraIdx = AuraIdx(19574);
/// Frenzy (pet attack speed stacks)
pub const FRENZY: AuraIdx = AuraIdx(272790);
/// Barbed Shot DoT
pub const BARBED_SHOT_DOT: AuraIdx = AuraIdx(217200);
/// Beast Cleave buff
pub const BEAST_CLEAVE: AuraIdx = AuraIdx(118455);
/// Thrill of the Hunt (crit stacks)
pub const THRILL_OF_THE_HUNT: AuraIdx = AuraIdx(257946);
/// Aspect of the Wild buff
pub const ASPECT_OF_THE_WILD: AuraIdx = AuraIdx(193530);
/// Call of the Wild buff
pub const CALL_OF_THE_WILD_BUFF: AuraIdx = AuraIdx(359844);
/// Bloodshed debuff
pub const BLOODSHED_DEBUFF: AuraIdx = AuraIdx(321538);

// ============================================================================
// Proc IDs
// ============================================================================

/// Wild Call (Barbed Shot reset)
pub const WILD_CALL: ProcIdx = ProcIdx(1);
/// Barbed Wrath CDR
pub const BARBED_WRATH: ProcIdx = ProcIdx(2);

// ============================================================================
// Tuning Constants
// ============================================================================

/// Focus regeneration per second (base)
pub const FOCUS_REGEN_BASE: f32 = 5.0;
/// Kill Command Focus cost
pub const KILL_COMMAND_COST: f32 = 30.0;
/// Cobra Shot Focus cost
pub const COBRA_SHOT_COST: f32 = 35.0;
/// Barbed Shot charges
pub const BARBED_SHOT_CHARGES: u8 = 2;
/// Barbed Shot recharge time (seconds)
pub const BARBED_SHOT_RECHARGE: f32 = 12.0;
/// Frenzy max stacks
pub const FRENZY_MAX_STACKS: u8 = 3;
/// Frenzy duration (seconds)
pub const FRENZY_DURATION: f32 = 8.0;
/// Bestial Wrath duration (seconds)
pub const BESTIAL_WRATH_DURATION: f32 = 15.0;
/// Bestial Wrath cooldown (seconds)
pub const BESTIAL_WRATH_COOLDOWN: f32 = 90.0;
/// Beast Cleave duration (seconds)
pub const BEAST_CLEAVE_DURATION: f32 = 4.0;
/// Wild Call proc chance
pub const WILD_CALL_CHANCE: f32 = 0.20;
/// Cobra Shot CDR for Kill Command
pub const COBRA_SHOT_CDR: f32 = 1.0;
