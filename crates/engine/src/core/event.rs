use wowlab_common::types::{AuraIdx, ProcIdx, SpellIdx, TargetIdx, UnitIdx};

#[derive(Clone, Debug)]
pub enum SimEvent {
    GcdEnd,
    CastComplete { spell: SpellIdx, target: TargetIdx },
    SpellDamage {
        spell: SpellIdx,
        target: TargetIdx,
        snapshot_id: u32,
    },
    AuraExpire { aura: AuraIdx, target: TargetIdx },
    AuraTick { aura: AuraIdx, target: TargetIdx },
    CooldownReady { spell: SpellIdx },
    ChargeReady { spell: SpellIdx },
    AutoAttack { unit: UnitIdx },
    PetAttack { pet: UnitIdx },
    ResourceTick,
    ProcIcdEnd { proc: ProcIdx },
    SimEnd,
}
