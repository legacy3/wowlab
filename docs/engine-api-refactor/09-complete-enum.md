# Complete Expr Enum

The full enum definition for implementation.

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AuraOn {
    Player,
    Target,
    Pet, // Note: If no pet is active, all aura queries return false/0
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Expr {
    // === Literals ===
    Bool { value: bool },
    Int { value: i64 },
    Float { value: f64 },

    // === Logic ===
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

    // === Variables ===
    Var { name: String },

    // === Resource ===
    ResourceCurrent { resource: String },
    ResourceMax { resource: String },
    ResourceDeficit { resource: String },
    ResourcePercent { resource: String },
    ResourceDeficitPercent { resource: String },
    ResourceRegen { resource: String },
    ResourceTimeToMax { resource: String },
    ResourceTimeTo { resource: String, amount: f64 },

    // === Cooldown ===
    CooldownReady { spell: String },
    CooldownRemaining { spell: String },
    CooldownDuration { spell: String },
    CooldownBaseDuration { spell: String },
    CooldownCharges { spell: String },
    CooldownChargesMax { spell: String },
    CooldownChargesFractional { spell: String },
    CooldownRechargeTime { spell: String },
    CooldownFullRechargeTime { spell: String },

    // === Aura ===
    AuraActive { aura: String, on: AuraOn },
    AuraInactive { aura: String, on: AuraOn }, // Equivalent to Not { AuraActive { ... } }, kept for readability
    AuraRemaining { aura: String, on: AuraOn },
    AuraStacks { aura: String, on: AuraOn },
    AuraStacksMax { aura: String, on: AuraOn },
    AuraDuration { aura: String, on: AuraOn },
    AuraRefreshable { aura: String, on: AuraOn },
    AuraTicking { aura: String, on: AuraOn },
    AuraTicksRemaining { aura: String, on: AuraOn },
    AuraTickTime { aura: String, on: AuraOn },
    AuraNextTick { aura: String, on: AuraOn },

    // === Combat ===
    CombatTime,
    CombatRemaining,

    // === Target ===
    TargetHealth,
    TargetHealthMax,
    TargetHealthPercent,
    TargetTimeToDie,
    TargetTimeToPercent { percent: f64 },
    TargetDistance,
    TargetCasting,
    TargetMoving,

    // === Enemy ===
    EnemyCount,
    SpellTargetsHit { spell: String },

    // === Player ===
    PlayerHealth,
    PlayerHealthMax,
    PlayerHealthPercent,
    PlayerHealthDeficit,
    PlayerHaste,
    PlayerCrit,
    PlayerMastery,
    PlayerVersatility,
    PlayerAttackPower,
    PlayerSpellPower,
    PlayerLevel,
    PlayerArmor,
    PlayerStamina,
    PlayerPrimaryStat,
    PlayerMoving,
    PlayerMovementRemaining,
    PlayerAlive,
    PlayerInCombat,
    PlayerStealthed,
    PlayerMounted,

    // === Spell ===
    SpellCost { spell: String },
    SpellCastTime { spell: String },
    SpellRange { spell: String },
    SpellInRange { spell: String },
    SpellUsable { spell: String },

    // === Talent ===
    TalentEnabled { talent: String },
    TalentRank { talent: String },
    TalentMaxRank { talent: String },

    // === GCD ===
    GcdActive,
    GcdRemaining,
    GcdDuration,

    // === Pet ===
    PetActive,
    PetCount,
    PetRemaining,
}

impl Expr {
    pub fn return_type(&self) -> ValueType {
        match self {
            // === Bool ===
            Self::Bool { .. } => ValueType::Bool,
            Self::And { .. } => ValueType::Bool,
            Self::Or { .. } => ValueType::Bool,
            Self::Not { .. } => ValueType::Bool,
            Self::Gt { .. } => ValueType::Bool,
            Self::Gte { .. } => ValueType::Bool,
            Self::Lt { .. } => ValueType::Bool,
            Self::Lte { .. } => ValueType::Bool,
            Self::Eq { .. } => ValueType::Bool,
            Self::Ne { .. } => ValueType::Bool,
            Self::CooldownReady { .. } => ValueType::Bool,
            Self::AuraActive { .. } => ValueType::Bool,
            Self::AuraInactive { .. } => ValueType::Bool,
            Self::AuraRefreshable { .. } => ValueType::Bool,
            Self::AuraTicking { .. } => ValueType::Bool,
            Self::TargetCasting => ValueType::Bool,
            Self::TargetMoving => ValueType::Bool,
            Self::SpellInRange { .. } => ValueType::Bool,
            Self::SpellUsable { .. } => ValueType::Bool,
            Self::TalentEnabled { .. } => ValueType::Bool,
            Self::GcdActive => ValueType::Bool,
            Self::PetActive => ValueType::Bool,
            Self::PlayerMoving => ValueType::Bool,
            Self::PlayerAlive => ValueType::Bool,
            Self::PlayerInCombat => ValueType::Bool,
            Self::PlayerStealthed => ValueType::Bool,
            Self::PlayerMounted => ValueType::Bool,

            // === Int ===
            Self::Int { .. } => ValueType::Int,
            Self::CooldownCharges { .. } => ValueType::Int,
            Self::CooldownChargesMax { .. } => ValueType::Int,
            Self::AuraStacks { .. } => ValueType::Int,
            Self::AuraStacksMax { .. } => ValueType::Int,
            Self::AuraTicksRemaining { .. } => ValueType::Int,
            Self::EnemyCount => ValueType::Int,
            Self::SpellTargetsHit { .. } => ValueType::Int,
            Self::PlayerLevel => ValueType::Int,
            Self::TalentRank { .. } => ValueType::Int,
            Self::TalentMaxRank { .. } => ValueType::Int,
            Self::PetCount => ValueType::Int,

            // === Float ===
            Self::Float { .. } => ValueType::Float,
            Self::Add { .. } => ValueType::Float,
            Self::Sub { .. } => ValueType::Float,
            Self::Mul { .. } => ValueType::Float,
            Self::Div { .. } => ValueType::Float,
            Self::Mod { .. } => ValueType::Float,
            Self::Floor { .. } => ValueType::Float,
            Self::Ceil { .. } => ValueType::Float,
            Self::Abs { .. } => ValueType::Float,
            Self::Min { .. } => ValueType::Float,
            Self::Max { .. } => ValueType::Float,
            Self::ResourceCurrent { .. } => ValueType::Float,
            Self::ResourceMax { .. } => ValueType::Float,
            Self::ResourceDeficit { .. } => ValueType::Float,
            Self::ResourcePercent { .. } => ValueType::Float,
            Self::ResourceDeficitPercent { .. } => ValueType::Float,
            Self::ResourceRegen { .. } => ValueType::Float,
            Self::ResourceTimeToMax { .. } => ValueType::Float,
            Self::ResourceTimeTo { .. } => ValueType::Float,
            Self::CooldownRemaining { .. } => ValueType::Float,
            Self::CooldownDuration { .. } => ValueType::Float,
            Self::CooldownBaseDuration { .. } => ValueType::Float,
            Self::CooldownChargesFractional { .. } => ValueType::Float,
            Self::CooldownRechargeTime { .. } => ValueType::Float,
            Self::CooldownFullRechargeTime { .. } => ValueType::Float,
            Self::AuraRemaining { .. } => ValueType::Float,
            Self::AuraDuration { .. } => ValueType::Float,
            Self::AuraTickTime { .. } => ValueType::Float,
            Self::AuraNextTick { .. } => ValueType::Float,
            Self::CombatTime => ValueType::Float,
            Self::CombatRemaining => ValueType::Float,
            Self::TargetHealth => ValueType::Float,
            Self::TargetHealthMax => ValueType::Float,
            Self::TargetHealthPercent => ValueType::Float,
            Self::TargetTimeToDie => ValueType::Float,
            Self::TargetTimeToPercent { .. } => ValueType::Float,
            Self::TargetDistance => ValueType::Float,
            Self::PlayerHealth => ValueType::Float,
            Self::PlayerHealthMax => ValueType::Float,
            Self::PlayerHealthPercent => ValueType::Float,
            Self::PlayerHealthDeficit => ValueType::Float,
            Self::PlayerHaste => ValueType::Float,
            Self::PlayerCrit => ValueType::Float,
            Self::PlayerMastery => ValueType::Float,
            Self::PlayerVersatility => ValueType::Float,
            Self::PlayerAttackPower => ValueType::Float,
            Self::PlayerSpellPower => ValueType::Float,
            Self::PlayerArmor => ValueType::Float,
            Self::PlayerStamina => ValueType::Float,
            Self::PlayerPrimaryStat => ValueType::Float,
            Self::PlayerMovementRemaining => ValueType::Float,
            Self::SpellCost { .. } => ValueType::Float,
            Self::SpellCastTime { .. } => ValueType::Float,
            Self::SpellRange { .. } => ValueType::Float,
            Self::GcdRemaining => ValueType::Float,
            Self::GcdDuration => ValueType::Float,
            Self::PetRemaining => ValueType::Float,

            // === Dynamic (determined at parse time) ===
            // Type determined at parse time from variable declaration
            Self::Var { .. } => ValueType::Float, // Default; actual type from declaration
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ValueType {
    Bool,
    Int,
    Float,
}
```

## Validation

String references (spell names, aura names, talent names, resource names) must be validated against game data at parse time.

```rust
impl Expr {
    /// Validates all string references against game data.
    /// Called at parse time. Returns error for unknown spells/auras/etc.
    pub fn validate(&self, registry: &GameDataRegistry) -> Result<(), ValidationError>;
}
```

## Evaluation

```rust
impl Expr {
    /// Evaluates expression against current game state.
    /// Assumes validate() was called successfully.
    pub fn evaluate(&self, ctx: &EvalContext) -> Value;
}

pub struct EvalContext<'a> {
    pub sim_state: &'a SimState,
    pub variables: &'a HashMap<String, Value>,
}
```

## Edge Cases

### AuraOn::Pet

When `AuraOn::Pet` is specified but no pet is currently active:

- All boolean queries (`AuraActive`, `AuraInactive`, `AuraRefreshable`, `AuraTicking`) return `false`
- All numeric queries (`AuraRemaining`, `AuraStacks`, etc.) return `0`
