use super::{ProcContext, ProcFlags};
use wowlab_common::types::{AuraIdx, ProcIdx, SpellIdx};

#[derive(Clone, Debug)]
pub enum ProcEffect {
    ApplyAura { aura: AuraIdx },
    CastSpell { spell: SpellIdx },
    Damage { base: f32, coefficient: f32 },
    Resource {
        resource: wowlab_common::types::ResourceType,
        amount: f32,
    },
    ReduceCooldown {
        spell: SpellIdx,
        amount: wowlab_common::types::SimTime,
    },
    ExtendAura {
        aura: AuraIdx,
        amount: wowlab_common::types::SimTime,
    },
    AddStacks { aura: AuraIdx, stacks: u8 },
    Multiple(Vec<ProcEffect>),
}

#[derive(Clone, Debug)]
pub struct ProcHandler {
    pub id: ProcIdx,
    pub name: &'static str,
    pub triggers: ProcFlags,
    pub effect: ProcEffect,
    pub spell_filter: Vec<SpellIdx>,
    pub requires_aura: Option<AuraIdx>,
}

impl ProcHandler {
    pub fn new(id: ProcIdx, name: &'static str, triggers: ProcFlags, effect: ProcEffect) -> Self {
        Self {
            id,
            name,
            triggers,
            effect,
            spell_filter: Vec::new(),
            requires_aura: None,
        }
    }

    pub fn with_spell_filter(mut self, spells: Vec<SpellIdx>) -> Self {
        self.spell_filter = spells;
        self
    }

    pub fn with_requires_aura(mut self, aura: AuraIdx) -> Self {
        self.requires_aura = Some(aura);
        self
    }

    pub fn can_trigger(&self, ctx: &ProcContext) -> bool {
        if !self.triggers.intersects(ctx.trigger) {
            return false;
        }

        if !self.spell_filter.is_empty() {
            if let Some(spell) = ctx.spell_id {
                if !self.spell_filter.contains(&spell) {
                    return false;
                }
            } else {
                return false;
            }
        }

        true
    }
}
