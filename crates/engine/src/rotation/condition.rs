use serde::Deserialize;

use crate::config::ResourceType;

/// Condition for rotation logic
#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Condition {
    /// All conditions must be true
    And { conditions: Vec<Condition> },

    /// Any condition must be true
    Or { conditions: Vec<Condition> },

    /// Negate a condition
    Not { condition: Box<Condition> },

    /// Spell is off cooldown (or has charges)
    SpellReady { spell_id: u32 },

    /// Spell cooldown remaining <= seconds
    SpellCooldown {
        spell_id: u32,
        comparison: Comparison,
        seconds: f32,
    },

    /// Spell has >= N charges
    SpellCharges {
        spell_id: u32,
        comparison: Comparison,
        charges: u8,
    },

    /// Resource >= or <= amount
    Resource {
        resource_type: ResourceType,
        comparison: Comparison,
        amount: f32,
    },

    /// Aura is active on unit
    AuraActive { aura_id: u32, on_target: bool },

    /// Aura has >= N stacks
    AuraStacks {
        aura_id: u32,
        on_target: bool,
        comparison: Comparison,
        stacks: u8,
    },

    /// Aura remaining duration
    AuraRemaining {
        aura_id: u32,
        on_target: bool,
        comparison: Comparison,
        seconds: f32,
    },

    /// Target health percentage
    TargetHealth {
        comparison: Comparison,
        percent: f32,
    },

    /// Time into fight
    FightTime {
        comparison: Comparison,
        seconds: f32,
    },

    /// Time remaining in fight
    FightRemaining {
        comparison: Comparison,
        seconds: f32,
    },

    /// GCD is ready
    GcdReady,

    /// Always true
    True,

    /// Always false
    False,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Comparison {
    Eq,
    Ne,
    Lt,
    Le,
    Gt,
    Ge,
}

impl Comparison {
    pub fn compare<T: PartialOrd>(&self, a: T, b: T) -> bool {
        match self {
            Comparison::Eq => a == b,
            Comparison::Ne => a != b,
            Comparison::Lt => a < b,
            Comparison::Le => a <= b,
            Comparison::Gt => a > b,
            Comparison::Ge => a >= b,
        }
    }
}
