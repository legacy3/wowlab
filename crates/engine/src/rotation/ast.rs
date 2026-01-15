//! Rotation AST types.
//!
//! Represents parsed rotation definitions before name resolution.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[cfg(feature = "wasm")]
use tsify::Tsify;

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

/// An expression.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum Expr {
    // === Literals ===
    Bool { value: bool },
    Int { value: i64 },
    Float { value: f64 },

    // === Variable reference (unresolved path) ===
    Var { path: VarPath },

    // === User variable reference ===
    UserVar { name: String },

    // === Logical ===
    And { operands: Vec<Expr> },
    Or { operands: Vec<Expr> },
    Not { operand: Box<Expr> },

    // === Comparison ===
    Gt { left: Box<Expr>, right: Box<Expr> },
    Gte { left: Box<Expr>, right: Box<Expr> },
    Lt { left: Box<Expr>, right: Box<Expr> },
    Lte { left: Box<Expr>, right: Box<Expr> },
    Eq { left: Box<Expr>, right: Box<Expr> },
    Ne { left: Box<Expr>, right: Box<Expr> },

    // === Arithmetic ===
    Add { left: Box<Expr>, right: Box<Expr> },
    Sub { left: Box<Expr>, right: Box<Expr> },
    Mul { left: Box<Expr>, right: Box<Expr> },
    Div { left: Box<Expr>, right: Box<Expr> },
    Mod { left: Box<Expr>, right: Box<Expr> },

    // === Functions ===
    Floor { operand: Box<Expr> },
    Ceil { operand: Box<Expr> },
    Abs { operand: Box<Expr> },
    Min { left: Box<Expr>, right: Box<Expr> },
    Max { left: Box<Expr>, right: Box<Expr> },
}

/// A variable path (e.g., "resource.focus", "cd.kill_command.ready").
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum VarPath {
    // === resource.* ===
    Resource { resource: String },
    ResourceMax { resource: String },
    ResourceDeficit { resource: String },
    ResourcePercent { resource: String },
    ResourceRegen { resource: String },

    // === player.* ===
    PlayerHealth,
    PlayerHealthMax,
    PlayerHealthPercent,

    // === cd.* ===
    CdReady { spell: String },
    CdRemaining { spell: String },
    CdDuration { spell: String },
    CdCharges { spell: String },
    CdChargesMax { spell: String },
    CdRechargeTime { spell: String },
    CdFullRecharge { spell: String },

    // === buff.* ===
    BuffActive { aura: String },
    BuffInactive { aura: String },
    BuffRemaining { aura: String },
    BuffStacks { aura: String },
    BuffStacksMax { aura: String },
    BuffDuration { aura: String },

    // === debuff.* ===
    DebuffActive { aura: String },
    DebuffInactive { aura: String },
    DebuffRemaining { aura: String },
    DebuffStacks { aura: String },
    DebuffRefreshable { aura: String },

    // === dot.* ===
    DotTicking { dot: String },
    DotRemaining { dot: String },
    DotRefreshable { dot: String },
    DotTicksRemaining { dot: String },

    // === target.* ===
    TargetHealthPercent,
    TargetTimeToDie,
    TargetDistance,

    // === enemy.* ===
    EnemyCount,

    // === combat.* ===
    CombatTime,
    CombatRemaining,

    // === gcd.* ===
    GcdRemaining,
    GcdDuration,

    // === pet.* ===
    PetActive,
    PetRemaining,
    PetBuffActive { aura: String },

    // === talent.* ===
    Talent { name: String },

    // === equipped.* ===
    Equipped { item: String },

    // === trinket.* ===
    TrinketReady { slot: u8 },
    TrinketRemaining { slot: u8 },

    // === spell.* ===
    SpellCost { spell: String },
    SpellCastTime { spell: String },
}

impl VarPath {
    /// Returns the type of value this path produces.
    pub fn value_type(&self) -> ValueType {
        match self {
            // Boolean values
            Self::CdReady { .. }
            | Self::BuffActive { .. }
            | Self::BuffInactive { .. }
            | Self::DebuffActive { .. }
            | Self::DebuffInactive { .. }
            | Self::DebuffRefreshable { .. }
            | Self::DotTicking { .. }
            | Self::DotRefreshable { .. }
            | Self::PetActive
            | Self::PetBuffActive { .. }
            | Self::Talent { .. }
            | Self::Equipped { .. }
            | Self::TrinketReady { .. } => ValueType::Bool,

            // Integer values
            Self::CdCharges { .. }
            | Self::CdChargesMax { .. }
            | Self::BuffStacks { .. }
            | Self::BuffStacksMax { .. }
            | Self::DebuffStacks { .. }
            | Self::DotTicksRemaining { .. }
            | Self::EnemyCount => ValueType::Int,

            // Float values (everything else)
            _ => ValueType::Float,
        }
    }
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

impl Expr {
    /// Check if this expression is a boolean variable reference.
    pub fn is_bool_var(&self) -> bool {
        match self {
            Expr::Var { path } => path.value_type() == ValueType::Bool,
            Expr::Bool { .. } => true,
            Expr::And { .. } | Expr::Or { .. } | Expr::Not { .. } => true,
            Expr::Gt { .. } | Expr::Gte { .. } | Expr::Lt { .. } | Expr::Lte { .. } => true,
            Expr::Eq { .. } | Expr::Ne { .. } => true,
            _ => false,
        }
    }
}
