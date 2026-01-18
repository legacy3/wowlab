use super::{ProcContext, ProcFlags};
use crate::types::{AuraIdx, ProcIdx, SpellIdx};

/// Result of a proc trigger
#[derive(Clone, Debug)]
pub enum ProcEffect {
    /// Apply an aura
    ApplyAura { aura: AuraIdx },
    /// Cast a spell
    CastSpell { spell: SpellIdx },
    /// Deal damage
    Damage { base: f32, coefficient: f32 },
    /// Grant resource
    Resource {
        resource: crate::types::ResourceType,
        amount: f32,
    },
    /// Reduce cooldown
    ReduceCooldown {
        spell: SpellIdx,
        amount: crate::types::SimTime,
    },
    /// Extend aura
    ExtendAura {
        aura: AuraIdx,
        amount: crate::types::SimTime,
    },
    /// Add stacks to aura
    AddStacks { aura: AuraIdx, stacks: u8 },
    /// Multiple effects
    Multiple(Vec<ProcEffect>),
}

/// Definition of a proc handler
#[derive(Clone, Debug)]
pub struct ProcHandler {
    /// Unique proc ID
    pub id: ProcIdx,
    /// Display name
    pub name: &'static str,
    /// What triggers this proc
    pub triggers: ProcFlags,
    /// Effect when proc occurs
    pub effect: ProcEffect,
    /// Only procs from specific spells (empty = all)
    pub spell_filter: Vec<SpellIdx>,
    /// Requires specific aura to be active
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

    /// Check if this proc can trigger from context
    pub fn can_trigger(&self, ctx: &ProcContext) -> bool {
        // Check trigger flags match
        if !self.triggers.intersects(ctx.trigger) {
            return false;
        }

        // Check spell filter
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
