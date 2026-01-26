use wowlab_common::types::{AuraIdx, ProcIdx, SpellIdx, TargetIdx, UnitIdx};

/// All possible simulation events
#[derive(Clone, Debug)]
pub enum SimEvent {
    /// GCD ends, can cast again
    GcdEnd,

    /// Cast completes, apply effects
    CastComplete { spell: SpellIdx, target: TargetIdx },

    /// Spell damage lands (after travel time)
    SpellDamage {
        spell: SpellIdx,
        target: TargetIdx,
        snapshot_id: u32,
    },

    /// Aura expires
    AuraExpire { aura: AuraIdx, target: TargetIdx },

    /// Periodic tick (DoT/HoT)
    AuraTick { aura: AuraIdx, target: TargetIdx },

    /// Cooldown ready
    CooldownReady { spell: SpellIdx },

    /// Charge regenerates
    ChargeReady { spell: SpellIdx },

    /// Auto-attack swing
    AutoAttack { unit: UnitIdx },

    /// Pet auto-attack
    PetAttack { pet: UnitIdx },

    /// Resource tick (energy/focus regen)
    ResourceTick,

    /// Proc internal cooldown ends
    ProcIcdEnd { proc: ProcIdx },

    /// Simulation ends
    SimEnd,
}
