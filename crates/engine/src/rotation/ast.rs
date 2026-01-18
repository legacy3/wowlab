//! Rotation AST types.
//!
//! Represents parsed and resolved rotation definitions.
//! Names are resolved to IDs at the parser boundary, eliminating the need
//! for a separate resolution phase.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[cfg(feature = "wasm")]
use tsify::Tsify;

use crate::types::{AuraIdx, SpellIdx};

use super::expr::{
    BuffExpr, CombatExpr, CooldownExpr, DebuffExpr, DotExpr, EnemyExpr, FieldType, GcdExpr,
    PetExpr, PlayerExpr, PopulateContext, ResourceExpr, SpellExpr, TalentExpr, TargetExpr,
};

/// A complete rotation definition.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub struct Rotation {
    pub name: String,
    /// User-defined variables (computed expressions).
    pub variables: HashMap<String, Expr>,
    /// Named action lists.
    pub lists: HashMap<String, Vec<Action>>,
    /// Entry point actions.
    pub actions: Vec<Action>,
}

/// An action in the rotation.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum Action {
    /// Cast a spell.
    #[serde(rename_all = "camelCase")]
    Cast {
        spell: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        condition: Option<Expr>,
    },
    /// Call a sub-list (returns if no action found).
    #[serde(rename_all = "camelCase")]
    Call {
        list: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        condition: Option<Expr>,
    },
    /// Run a sub-list (does not return if no action found).
    #[serde(rename_all = "camelCase")]
    Run {
        list: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        condition: Option<Expr>,
    },
    /// Set a runtime variable.
    #[serde(rename_all = "camelCase")]
    SetVar {
        name: String,
        value: Expr,
        #[serde(skip_serializing_if = "Option::is_none")]
        condition: Option<Expr>,
    },
    /// Modify a runtime variable.
    #[serde(rename_all = "camelCase")]
    ModifyVar {
        name: String,
        op: VarOp,
        value: Expr,
        #[serde(skip_serializing_if = "Option::is_none")]
        condition: Option<Expr>,
    },
    /// Wait for a fixed duration.
    #[serde(rename_all = "camelCase")]
    Wait {
        seconds: f64,
        #[serde(skip_serializing_if = "Option::is_none")]
        condition: Option<Expr>,
    },
    /// Wait until a condition is true.
    #[serde(rename_all = "camelCase")]
    WaitUntil { condition: Expr },
    /// Pool resources.
    #[serde(rename_all = "camelCase")]
    Pool {
        #[serde(skip_serializing_if = "Option::is_none")]
        extra: Option<f64>,
        #[serde(skip_serializing_if = "Option::is_none")]
        condition: Option<Expr>,
    },
    /// Use a trinket by slot.
    #[serde(rename_all = "camelCase")]
    UseTrinket {
        slot: u8,
        #[serde(skip_serializing_if = "Option::is_none")]
        condition: Option<Expr>,
    },
    /// Use an item by name.
    #[serde(rename_all = "camelCase")]
    UseItem {
        name: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        condition: Option<Expr>,
    },
}

/// Variable modification operation.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum VarOp {
    Set,
    Add,
    Sub,
    Mul,
    Div,
    Min,
    Max,
    Reset,
}

/// An expression in the rotation DSL.
///
/// This unified enum replaces the old VarPath + ResolvedVar dual-hierarchy.
/// Domain-specific expressions are nested as sub-enums for organization.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum Expr {
    // === Literals ===
    Bool {
        value: bool,
    },
    Int {
        value: i64,
    },
    Float {
        value: f64,
    },

    // === User variable reference ===
    UserVar {
        name: String,
    },

    // === Domain expressions (resolved) ===
    /// Resource expressions (focus, mana, etc.).
    Resource(ResourceExpr),
    /// Cooldown expressions.
    Cooldown(CooldownExpr),
    /// Buff expressions (auras on player).
    Buff(BuffExpr),
    /// Debuff expressions (auras on target).
    Debuff(DebuffExpr),
    /// DoT expressions (damage over time).
    Dot(DotExpr),
    /// Combat timing expressions.
    Combat(CombatExpr),
    /// Target expressions.
    Target(TargetExpr),
    /// Enemy expressions.
    Enemy(EnemyExpr),
    /// Player expressions.
    Player(PlayerExpr),
    /// Spell info expressions.
    Spell(SpellExpr),
    /// Talent expressions (compile-time constants).
    Talent(TalentExpr),
    /// GCD expressions.
    Gcd(GcdExpr),
    /// Pet expressions.
    Pet(PetExpr),
    /// Equipment expressions.
    Equipped {
        item: String,
    },
    /// Trinket ready expression.
    TrinketReady {
        slot: u8,
    },
    /// Trinket cooldown remaining.
    TrinketRemaining {
        slot: u8,
    },

    // === Logical ===
    And {
        operands: Vec<Expr>,
    },
    Or {
        operands: Vec<Expr>,
    },
    Not {
        operand: Box<Expr>,
    },

    // === Comparison ===
    Gt {
        left: Box<Expr>,
        right: Box<Expr>,
    },
    Gte {
        left: Box<Expr>,
        right: Box<Expr>,
    },
    Lt {
        left: Box<Expr>,
        right: Box<Expr>,
    },
    Lte {
        left: Box<Expr>,
        right: Box<Expr>,
    },
    Eq {
        left: Box<Expr>,
        right: Box<Expr>,
    },
    Ne {
        left: Box<Expr>,
        right: Box<Expr>,
    },

    // === Arithmetic ===
    Add {
        left: Box<Expr>,
        right: Box<Expr>,
    },
    Sub {
        left: Box<Expr>,
        right: Box<Expr>,
    },
    Mul {
        left: Box<Expr>,
        right: Box<Expr>,
    },
    Div {
        left: Box<Expr>,
        right: Box<Expr>,
    },
    Mod {
        left: Box<Expr>,
        right: Box<Expr>,
    },

    // === Functions ===
    Floor {
        operand: Box<Expr>,
    },
    Ceil {
        operand: Box<Expr>,
    },
    Abs {
        operand: Box<Expr>,
    },
    Min {
        left: Box<Expr>,
        right: Box<Expr>,
    },
    Max {
        left: Box<Expr>,
        right: Box<Expr>,
    },
}

/// Value type for type checking.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum ValueType {
    Bool,
    Int,
    Float,
}

impl From<FieldType> for ValueType {
    fn from(ft: FieldType) -> Self {
        match ft {
            FieldType::Bool => ValueType::Bool,
            FieldType::Int => ValueType::Int,
            FieldType::Float => ValueType::Float,
        }
    }
}

impl Expr {
    /// Returns the type of value this expression produces.
    pub fn value_type(&self) -> ValueType {
        match self {
            // Literals
            Self::Bool { .. } => ValueType::Bool,
            Self::Int { .. } => ValueType::Int,
            Self::Float { .. } => ValueType::Float,

            // User variables - type unknown at compile time, assume float
            Self::UserVar { .. } => ValueType::Float,

            // Domain expressions
            Self::Resource(e) => e.field_type().into(),
            Self::Cooldown(e) => e.field_type().into(),
            Self::Buff(e) => e.field_type().into(),
            Self::Debuff(e) => e.field_type().into(),
            Self::Dot(e) => e.field_type().into(),
            Self::Combat(e) => e.field_type().into(),
            Self::Target(e) => e.field_type().into(),
            Self::Enemy(e) => e.field_type().into(),
            Self::Player(e) => e.field_type().into(),
            Self::Spell(e) => e.field_type().into(),
            Self::Talent(e) => e.field_type().into(),
            Self::Gcd(e) => e.field_type().into(),
            Self::Pet(e) => e.field_type().into(),

            // Equipment/trinket
            Self::Equipped { .. } | Self::TrinketReady { .. } => ValueType::Bool,
            Self::TrinketRemaining { .. } => ValueType::Float,

            // Logical/comparison always bool
            Self::And { .. }
            | Self::Or { .. }
            | Self::Not { .. }
            | Self::Gt { .. }
            | Self::Gte { .. }
            | Self::Lt { .. }
            | Self::Lte { .. }
            | Self::Eq { .. }
            | Self::Ne { .. } => ValueType::Bool,

            // Arithmetic always float
            Self::Add { .. }
            | Self::Sub { .. }
            | Self::Mul { .. }
            | Self::Div { .. }
            | Self::Mod { .. }
            | Self::Floor { .. }
            | Self::Ceil { .. }
            | Self::Abs { .. }
            | Self::Min { .. }
            | Self::Max { .. } => ValueType::Float,
        }
    }

    /// Check if this expression is a boolean expression.
    pub fn is_bool(&self) -> bool {
        self.value_type() == ValueType::Bool
    }

    /// Check if this expression is an integer expression.
    pub fn is_int(&self) -> bool {
        self.value_type() == ValueType::Int
    }

    /// Check if this expression is a float expression.
    pub fn is_float(&self) -> bool {
        self.value_type() == ValueType::Float
    }

    /// Get the spell ID if this is a cooldown expression.
    pub fn cooldown_spell(&self) -> Option<SpellIdx> {
        match self {
            Self::Cooldown(e) => Some(e.spell_id()),
            _ => None,
        }
    }

    /// Get the aura ID if this is a buff expression.
    pub fn buff_aura(&self) -> Option<AuraIdx> {
        match self {
            Self::Buff(e) => Some(e.aura_id()),
            _ => None,
        }
    }

    /// Get the aura ID if this is a debuff expression.
    pub fn debuff_aura(&self) -> Option<AuraIdx> {
        match self {
            Self::Debuff(e) => Some(e.aura_id()),
            _ => None,
        }
    }

    /// Get the aura ID if this is a DoT expression.
    pub fn dot_aura(&self) -> Option<AuraIdx> {
        match self {
            Self::Dot(e) => Some(e.aura_id()),
            _ => None,
        }
    }

    /// Validate that expression depth does not exceed the maximum allowed.
    ///
    /// This prevents stack overflow from deeply nested expressions.
    /// Returns an error if depth exceeds MAX_DEPTH (100).
    pub fn validate_depth(&self) -> super::error::Result<()> {
        self.validate_depth_recursive(0)
    }

    fn validate_depth_recursive(&self, depth: usize) -> super::error::Result<()> {
        use super::eval::MAX_DEPTH;

        if depth > MAX_DEPTH {
            return Err(super::error::Error::MaxDepthExceeded {
                depth,
                max: MAX_DEPTH,
            });
        }

        match self {
            // Leaf nodes - no children to check
            Self::Bool { .. }
            | Self::Int { .. }
            | Self::Float { .. }
            | Self::UserVar { .. }
            | Self::Resource(_)
            | Self::Cooldown(_)
            | Self::Buff(_)
            | Self::Debuff(_)
            | Self::Dot(_)
            | Self::Combat(_)
            | Self::Target(_)
            | Self::Enemy(_)
            | Self::Player(_)
            | Self::Spell(_)
            | Self::Talent(_)
            | Self::Gcd(_)
            | Self::Pet(_)
            | Self::Equipped { .. }
            | Self::TrinketReady { .. }
            | Self::TrinketRemaining { .. } => Ok(()),

            // Unary operators - check single child
            Self::Not { operand }
            | Self::Floor { operand }
            | Self::Ceil { operand }
            | Self::Abs { operand } => operand.validate_depth_recursive(depth + 1),

            // N-ary operators - check all operands
            Self::And { operands } | Self::Or { operands } => {
                for operand in operands {
                    operand.validate_depth_recursive(depth + 1)?;
                }
                Ok(())
            }

            // Binary operators - check both children
            Self::Gt { left, right }
            | Self::Gte { left, right }
            | Self::Lt { left, right }
            | Self::Lte { left, right }
            | Self::Eq { left, right }
            | Self::Ne { left, right }
            | Self::Add { left, right }
            | Self::Sub { left, right }
            | Self::Mul { left, right }
            | Self::Div { left, right }
            | Self::Mod { left, right }
            | Self::Min { left, right }
            | Self::Max { left, right } => {
                left.validate_depth_recursive(depth + 1)?;
                right.validate_depth_recursive(depth + 1)
            }
        }
    }
}
