//! Rotation AST types.
//!
//! Represents parsed rotation definitions before name resolution.

use std::collections::HashMap;

/// A complete rotation definition.
#[derive(Debug, Clone)]
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
#[derive(Debug, Clone)]
pub enum Action {
    /// Cast a spell.
    Cast {
        spell: String,
        condition: Option<Expr>,
    },
    /// Call a sub-list (returns if no action found).
    Call {
        list: String,
        condition: Option<Expr>,
    },
    /// Run a sub-list (does not return if no action found).
    Run {
        list: String,
        condition: Option<Expr>,
    },
    /// Set a runtime variable.
    SetVar {
        name: String,
        value: Expr,
        condition: Option<Expr>,
    },
    /// Modify a runtime variable.
    ModifyVar {
        name: String,
        op: VarOp,
        value: Expr,
        condition: Option<Expr>,
    },
    /// Wait for a fixed duration.
    Wait {
        seconds: f64,
        condition: Option<Expr>,
    },
    /// Wait until a condition is true.
    WaitUntil {
        condition: Expr,
    },
    /// Pool resources.
    Pool {
        extra: Option<f64>,
        condition: Option<Expr>,
    },
    /// Use a trinket by slot.
    UseTrinket {
        slot: u8,
        condition: Option<Expr>,
    },
    /// Use an item by name.
    UseItem {
        name: String,
        condition: Option<Expr>,
    },
}

/// Variable modification operation.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
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
#[derive(Debug, Clone)]
pub enum Expr {
    // === Literals ===
    Bool(bool),
    Int(i64),
    Float(f64),

    // === Variable reference (unresolved path) ===
    Var(VarPath),

    // === User variable reference ===
    UserVar(String),

    // === Logical ===
    And(Vec<Expr>),
    Or(Vec<Expr>),
    Not(Box<Expr>),

    // === Comparison ===
    Gt(Box<Expr>, Box<Expr>),
    Gte(Box<Expr>, Box<Expr>),
    Lt(Box<Expr>, Box<Expr>),
    Lte(Box<Expr>, Box<Expr>),
    Eq(Box<Expr>, Box<Expr>),
    Ne(Box<Expr>, Box<Expr>),

    // === Arithmetic ===
    Add(Box<Expr>, Box<Expr>),
    Sub(Box<Expr>, Box<Expr>),
    Mul(Box<Expr>, Box<Expr>),
    Div(Box<Expr>, Box<Expr>),
    Mod(Box<Expr>, Box<Expr>),

    // === Functions ===
    Floor(Box<Expr>),
    Ceil(Box<Expr>),
    Abs(Box<Expr>),
    Min(Box<Expr>, Box<Expr>),
    Max(Box<Expr>, Box<Expr>),
}

/// A variable path (e.g., "resource.focus", "cd.kill_command.ready").
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum VarPath {
    // === resource.* ===
    Resource(String),
    ResourceMax(String),
    ResourceDeficit(String),
    ResourcePercent(String),
    ResourceRegen(String),

    // === player.* ===
    PlayerHealth,
    PlayerHealthMax,
    PlayerHealthPercent,

    // === cd.* ===
    CdReady(String),
    CdRemaining(String),
    CdDuration(String),
    CdCharges(String),
    CdChargesMax(String),
    CdRechargeTime(String),
    CdFullRecharge(String),

    // === buff.* ===
    BuffActive(String),
    BuffInactive(String),
    BuffRemaining(String),
    BuffStacks(String),
    BuffStacksMax(String),
    BuffDuration(String),

    // === debuff.* ===
    DebuffActive(String),
    DebuffInactive(String),
    DebuffRemaining(String),
    DebuffStacks(String),
    DebuffRefreshable(String),

    // === dot.* ===
    DotTicking(String),
    DotRemaining(String),
    DotRefreshable(String),
    DotTicksRemaining(String),

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
    PetBuffActive(String),

    // === talent.* ===
    Talent(String),

    // === equipped.* ===
    Equipped(String),

    // === trinket.* ===
    TrinketReady(u8),
    TrinketRemaining(u8),

    // === spell.* ===
    SpellCost(String),
    SpellCastTime(String),
}

impl VarPath {
    /// Returns the type of value this path produces.
    pub fn value_type(&self) -> ValueType {
        match self {
            // Boolean values
            Self::CdReady(_)
            | Self::BuffActive(_)
            | Self::BuffInactive(_)
            | Self::DebuffActive(_)
            | Self::DebuffInactive(_)
            | Self::DebuffRefreshable(_)
            | Self::DotTicking(_)
            | Self::DotRefreshable(_)
            | Self::PetActive
            | Self::PetBuffActive(_)
            | Self::Talent(_)
            | Self::Equipped(_)
            | Self::TrinketReady(_) => ValueType::Bool,

            // Integer values
            Self::CdCharges(_)
            | Self::CdChargesMax(_)
            | Self::BuffStacks(_)
            | Self::BuffStacksMax(_)
            | Self::DebuffStacks(_)
            | Self::DotTicksRemaining(_)
            | Self::EnemyCount => ValueType::Int,

            // Float values (everything else)
            _ => ValueType::Float,
        }
    }
}

/// Value type for type checking.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ValueType {
    Bool,
    Int,
    Float,
}

impl Expr {
    /// Check if this expression is a boolean variable reference.
    pub fn is_bool_var(&self) -> bool {
        match self {
            Expr::Var(path) => path.value_type() == ValueType::Bool,
            Expr::Bool(_) => true,
            Expr::And(_) | Expr::Or(_) | Expr::Not(_) => true,
            Expr::Gt(..) | Expr::Gte(..) | Expr::Lt(..) | Expr::Lte(..) => true,
            Expr::Eq(..) | Expr::Ne(..) => true,
            _ => false,
        }
    }
}
