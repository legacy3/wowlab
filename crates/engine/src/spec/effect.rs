//! Declarative spell effects and damage modifiers.
//!
//! This module provides a data-driven way to define spell behavior
//! without scattered if/else chains in handlers.

use wowlab_types::{AuraIdx, PetKind, SpellIdx};
use serde::{Deserialize, Serialize};

/// Effect that fires when a spell is cast.
#[derive(Clone, Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(tsify::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum SpellEffect {
    /// Reduce a cooldown by a flat amount.
    ReduceCooldown { spell: SpellIdx, amount: f32 },

    /// Gain a charge of a charged cooldown.
    GainCharge { spell: SpellIdx },

    /// Trigger another spell (like a proc).
    TriggerSpell { spell: SpellIdx },

    /// Summon a pet/guardian.
    SummonPet {
        kind: PetKind,
        duration: f32,
        name: String,
    },

    /// Apply a buff to the player (with optional stack count).
    ApplyBuff { aura: AuraIdx, stacks: u8 },

    /// Apply a debuff to the target.
    ApplyDebuff { aura: AuraIdx, stacks: u8 },

    /// Extend an existing aura's duration.
    ExtendAura { aura: AuraIdx, amount: f32 },

    /// Refresh an aura to full duration.
    RefreshAura { aura: AuraIdx },

    /// Pet also casts this spell (Animal Companion style).
    PetMirrorCast { damage_pct: f32 },

    /// Cleave damage to nearby targets.
    Cleave { damage_pct: f32, max_targets: u8 },

    /// Conditional effect - only fires if condition is true.
    Conditional {
        condition: EffectCondition,
        effect: Box<SpellEffect>,
    },

    /// Multiple effects.
    Multi(Vec<SpellEffect>),
}

/// Conditions for conditional effects.
#[derive(Clone, Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(tsify::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum EffectCondition {
    /// Buff is active on player.
    BuffActive(AuraIdx),

    /// Debuff is active on target.
    DebuffActive(AuraIdx),

    /// Talent is enabled.
    TalentEnabled(String),

    /// Target health below percentage.
    TargetHealthBelow(f32),

    /// Player health below percentage.
    PlayerHealthBelow(f32),

    /// During a specific buff window (like Call of the Wild).
    DuringBuff(AuraIdx),

    /// Pet is active.
    PetActive,

    /// Has at least N stacks of an aura.
    HasStacks { aura: AuraIdx, min: u8 },

    /// Cooldown is ready.
    CooldownReady(SpellIdx),

    /// Logical AND of conditions.
    And(Vec<EffectCondition>),

    /// Logical OR of conditions.
    Or(Vec<EffectCondition>),

    /// Logical NOT.
    Not(Box<EffectCondition>),
}

/// Damage modifier that affects spell damage calculation.
#[derive(Clone, Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(tsify::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub struct DamageMod {
    /// Unique identifier for debugging.
    pub name: String,

    /// Multiplicative modifier (1.0 = no change, 1.5 = +50%).
    pub multiplier: f32,

    /// When this modifier applies.
    pub condition: ModCondition,

    /// Priority for ordering (higher = applied later).
    pub priority: i8,
}

/// Conditions for damage modifiers.
#[derive(Clone, Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(tsify::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum ModCondition {
    /// Always applies.
    Always,

    /// Only for specific spell.
    ForSpell(SpellIdx),

    /// Only for spells with PET_ABILITY flag.
    PetAbility,

    /// When buff is active.
    BuffActive(AuraIdx),

    /// When debuff is on target.
    DebuffActive(AuraIdx),

    /// Target health below threshold.
    TargetHealthBelow(f32),

    /// On critical hit only.
    OnCrit,

    /// Per stack of an aura.
    PerStack { aura: AuraIdx, per_stack: f32 },

    /// During execute phase (target < 20%).
    ExecutePhase,

    /// Scales with a stat (like crit scaling).
    StatScaling { base: f32 },

    /// Talent is enabled.
    TalentEnabled(String),

    /// Multiple conditions (all must be true).
    And(Vec<ModCondition>),

    /// Any condition (at least one must be true).
    Or(Vec<ModCondition>),
}

impl DamageMod {
    /// Create a simple always-active modifier.
    pub fn always(name: impl Into<String>, multiplier: f32) -> Self {
        Self {
            name: name.into(),
            multiplier,
            condition: ModCondition::Always,
            priority: 0,
        }
    }

    /// Create a modifier for a specific spell.
    pub fn for_spell(name: impl Into<String>, spell: SpellIdx, multiplier: f32) -> Self {
        Self {
            name: name.into(),
            multiplier,
            condition: ModCondition::ForSpell(spell),
            priority: 0,
        }
    }

    /// Create a modifier that applies when a buff is active.
    pub fn when_buff(name: impl Into<String>, aura: AuraIdx, multiplier: f32) -> Self {
        Self {
            name: name.into(),
            multiplier,
            condition: ModCondition::BuffActive(aura),
            priority: 0,
        }
    }

    /// Create a modifier for pet abilities.
    pub fn pet_ability(name: impl Into<String>, multiplier: f32) -> Self {
        Self {
            name: name.into(),
            multiplier,
            condition: ModCondition::PetAbility,
            priority: 0,
        }
    }

    /// Create a modifier for execute phase.
    pub fn execute(name: impl Into<String>, threshold: f32, multiplier: f32) -> Self {
        Self {
            name: name.into(),
            multiplier,
            condition: ModCondition::TargetHealthBelow(threshold),
            priority: 0,
        }
    }

    /// Create a per-stack modifier.
    pub fn per_stack(name: impl Into<String>, aura: AuraIdx, per_stack: f32) -> Self {
        Self {
            name: name.into(),
            multiplier: 1.0, // Base multiplier, actual calculated at runtime
            condition: ModCondition::PerStack { aura, per_stack },
            priority: 0,
        }
    }

    /// Set priority.
    pub fn with_priority(mut self, priority: i8) -> Self {
        self.priority = priority;
        self
    }

    /// Add additional condition.
    pub fn when(mut self, condition: ModCondition) -> Self {
        self.condition = match self.condition {
            ModCondition::Always => condition,
            existing => ModCondition::And(vec![existing, condition]),
        };
        self
    }
}

/// Helper to build conditional effects.
impl SpellEffect {
    /// Create a conditional effect.
    pub fn when(condition: EffectCondition, effect: SpellEffect) -> Self {
        SpellEffect::Conditional {
            condition,
            effect: Box::new(effect),
        }
    }

    /// Create effect that only fires with talent.
    pub fn with_talent(talent: impl Into<String>, effect: SpellEffect) -> Self {
        SpellEffect::Conditional {
            condition: EffectCondition::TalentEnabled(talent.into()),
            effect: Box::new(effect),
        }
    }

    /// Create effect that only fires during a buff.
    pub fn during_buff(aura: AuraIdx, effect: SpellEffect) -> Self {
        SpellEffect::Conditional {
            condition: EffectCondition::DuringBuff(aura),
            effect: Box::new(effect),
        }
    }
}

/// Talent definition with associated modifiers.
#[derive(Clone, Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(tsify::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub struct TalentDef {
    /// Internal name (snake_case).
    pub name: String,

    /// Display name.
    pub display_name: String,

    /// Damage modifiers this talent provides.
    pub damage_mods: Vec<DamageMod>,

    /// Cooldown modifications.
    pub cooldown_mods: Vec<CooldownMod>,

    /// Charge modifications.
    pub charge_mods: Vec<ChargeMod>,

    /// Additional spell effects when talent is active.
    pub spell_effects: Vec<(SpellIdx, SpellEffect)>,
}

/// Cooldown modification from a talent.
#[derive(Clone, Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(tsify::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub struct CooldownMod {
    pub spell: SpellIdx,
    /// Flat reduction in seconds.
    pub flat_reduction: f32,
    /// Percentage reduction (0.1 = 10% faster).
    pub percent_reduction: f32,
}

/// Charge modification from a talent.
#[derive(Clone, Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(tsify::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub struct ChargeMod {
    pub spell: SpellIdx,
    /// Additional charges.
    pub extra_charges: i8,
}

impl TalentDef {
    pub fn new(name: impl Into<String>, display_name: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            display_name: display_name.into(),
            damage_mods: Vec::new(),
            cooldown_mods: Vec::new(),
            charge_mods: Vec::new(),
            spell_effects: Vec::new(),
        }
    }

    /// Add a damage modifier.
    pub fn damage_mod(mut self, modifier: DamageMod) -> Self {
        self.damage_mods.push(modifier);
        self
    }

    /// Add a spell-specific damage bonus.
    pub fn spell_damage(mut self, spell: SpellIdx, multiplier: f32) -> Self {
        self.damage_mods
            .push(DamageMod::for_spell(self.name.clone(), spell, multiplier));
        self
    }

    /// Add execute damage bonus.
    pub fn execute_damage(mut self, threshold: f32, multiplier: f32) -> Self {
        self.damage_mods
            .push(DamageMod::execute(self.name.clone(), threshold, multiplier));
        self
    }

    /// Add pet damage bonus.
    pub fn pet_damage(mut self, multiplier: f32) -> Self {
        self.damage_mods
            .push(DamageMod::pet_ability(self.name.clone(), multiplier));
        self
    }

    /// Add extra charges to a spell.
    pub fn extra_charges(mut self, spell: SpellIdx, count: i8) -> Self {
        self.charge_mods.push(ChargeMod {
            spell,
            extra_charges: count,
        });
        self
    }

    /// Add cooldown reduction.
    pub fn cooldown_reduction(mut self, spell: SpellIdx, flat: f32, percent: f32) -> Self {
        self.cooldown_mods.push(CooldownMod {
            spell,
            flat_reduction: flat,
            percent_reduction: percent,
        });
        self
    }

    /// Add a spell effect that triggers with this talent.
    pub fn on_spell(mut self, spell: SpellIdx, effect: SpellEffect) -> Self {
        self.spell_effects.push((spell, effect));
        self
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use wowlab_types::{AuraIdx, SpellIdx};

    const TEST_SPELL: SpellIdx = SpellIdx(1);
    const TEST_AURA: AuraIdx = AuraIdx(1);

    #[test]
    fn damage_mod_always() {
        let m = DamageMod::always("test", 1.5);
        assert_eq!(m.multiplier, 1.5);
        assert!(matches!(m.condition, ModCondition::Always));
    }

    #[test]
    fn damage_mod_for_spell() {
        let m = DamageMod::for_spell("test", TEST_SPELL, 1.3);
        assert!(matches!(m.condition, ModCondition::ForSpell(s) if s == TEST_SPELL));
    }

    #[test]
    fn damage_mod_chaining() {
        // First when() on Always replaces it with the new condition
        let m = DamageMod::always("test", 1.2)
            .when(ModCondition::BuffActive(TEST_AURA))
            .with_priority(5);
        assert_eq!(m.priority, 5);
        assert!(matches!(m.condition, ModCondition::BuffActive(_)));

        // Second when() wraps both in And
        let m2 = DamageMod::for_spell("test", TEST_SPELL, 1.2)
            .when(ModCondition::BuffActive(TEST_AURA))
            .with_priority(5);
        assert!(matches!(m2.condition, ModCondition::And(_)));
    }

    #[test]
    fn spell_effect_conditional() {
        let effect = SpellEffect::with_talent(
            "test_talent",
            SpellEffect::TriggerSpell { spell: TEST_SPELL },
        );
        assert!(matches!(effect, SpellEffect::Conditional { .. }));
    }

    #[test]
    fn talent_def_builder() {
        let talent = TalentDef::new("alpha_predator", "Alpha Predator")
            .spell_damage(TEST_SPELL, 1.3)
            .extra_charges(TEST_SPELL, 1);

        assert_eq!(talent.name, "alpha_predator");
        assert_eq!(talent.damage_mods.len(), 1);
        assert_eq!(talent.charge_mods.len(), 1);
    }
}
