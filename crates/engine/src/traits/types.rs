//! Core trait type definitions.

use serde::Deserialize;

/// Trait tree types (matches SimC's talent_tree enum).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Deserialize)]
#[serde(rename_all = "snake_case")]
#[repr(u8)]
pub enum TraitTree {
    /// Invalid/unknown tree
    Invalid = 0,
    /// Shared class traits
    Class = 1,
    /// Spec-specific traits
    Specialization = 2,
    /// Hero traits
    Hero = 3,
    /// Hero tree selection node
    Selection = 4,
}

impl Default for TraitTree {
    fn default() -> Self {
        Self::Invalid
    }
}

impl From<u8> for TraitTree {
    fn from(v: u8) -> Self {
        match v {
            1 => Self::Class,
            2 => Self::Specialization,
            3 => Self::Hero,
            4 => Self::Selection,
            _ => Self::Invalid,
        }
    }
}

/// A trait definition with its effects.
///
/// Traits can modify spells, add procs, grant passive auras, or unlock abilities.
#[derive(Debug, Clone)]
pub struct TraitDefinition {
    /// Unique trait ID (trait_node_entry_id from DBC).
    pub id: u32,

    /// Trait name for display/debugging.
    pub name: String,

    /// Which trait tree this belongs to.
    pub tree: TraitTree,

    /// Maximum ranks for this trait.
    pub max_ranks: u8,

    /// Spell ID this trait grants or modifies.
    pub spell_id: u32,

    /// Effects this trait provides.
    pub effects: Vec<TraitEffect>,
}

impl TraitDefinition {
    /// Create a new trait definition.
    pub fn new(id: u32, name: impl Into<String>, tree: TraitTree) -> Self {
        Self {
            id,
            name: name.into(),
            tree,
            max_ranks: 1,
            spell_id: 0,
            effects: Vec::new(),
        }
    }

    /// Set max ranks (builder pattern).
    pub fn with_max_ranks(mut self, ranks: u8) -> Self {
        self.max_ranks = ranks;
        self
    }

    /// Set spell ID (builder pattern).
    pub fn with_spell_id(mut self, spell_id: u32) -> Self {
        self.spell_id = spell_id;
        self
    }

    /// Add an effect (builder pattern).
    pub fn with_effect(mut self, effect: TraitEffect) -> Self {
        self.effects.push(effect);
        self
    }
}

/// Effects a trait can have.
#[derive(Debug, Clone)]
pub enum TraitEffect {
    /// Grant a passive aura while selected.
    GrantAura {
        /// Aura ID to apply.
        aura_id: u32,
    },

    /// Modify a spell's properties.
    ModifySpell {
        /// Spell to modify (0 = the trait's spell_id).
        spell_id: u32,
        /// How to modify the spell.
        modification: SpellModification,
    },

    /// Add a proc effect.
    AddProc {
        /// What triggers the proc.
        trigger: super::ProcTrigger,
        /// What happens when it procs.
        effect: super::ProcEffect,
        /// Proc chance (0.0-1.0).
        chance: f32,
        /// Internal cooldown in milliseconds.
        icd_ms: u32,
    },

    /// Unlock/learn a spell.
    LearnSpell {
        /// Spell ID to learn.
        spell_id: u32,
    },

    /// Replace one spell with another.
    ReplaceSpell {
        /// Original spell ID.
        original_id: u32,
        /// Replacement spell ID.
        replacement_id: u32,
    },
}

/// How a trait can modify a spell.
#[derive(Debug, Clone)]
pub enum SpellModification {
    /// Reduce cooldown by a flat amount (milliseconds).
    CooldownReduction {
        /// Amount to reduce in ms.
        amount_ms: i32,
    },

    /// Reduce cooldown by a percentage.
    CooldownReductionPct {
        /// Percentage reduction (0.0-1.0).
        percent: f32,
    },

    /// Increase damage by percentage.
    DamageIncrease {
        /// Percentage increase (0.25 = +25%).
        percent: f32,
    },

    /// Reduce resource cost.
    CostReduction {
        /// Amount to reduce.
        amount: f32,
    },

    /// Add additional charges.
    AddCharges {
        /// Number of charges to add.
        charges: u8,
    },

    /// Increase effect value (generic modifier).
    EffectValue {
        /// Effect index (1-based, like SimC).
        effect_index: u8,
        /// Percentage increase.
        percent: f32,
    },
}
