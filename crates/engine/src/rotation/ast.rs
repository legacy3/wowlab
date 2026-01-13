//! Rotation AST types.

/// A complete rotation - a prioritized list of actions.
#[derive(Debug, Clone)]
pub struct Rotation {
    pub name: String,
    pub actions: Vec<RotationAction>,
}

/// A single action in the rotation.
#[derive(Debug, Clone)]
pub struct RotationAction {
    /// Game spell ID (e.g., 34026 for Kill Command).
    pub spell_id: u32,
    pub condition: Option<Condition>,
}

/// A condition expression.
#[derive(Debug, Clone)]
pub enum Condition {
    And(Box<Condition>, Box<Condition>),
    Or(Box<Condition>, Box<Condition>),
    Not(Box<Condition>),

    Gte(Operand, Operand),
    Gt(Operand, Operand),
    Lte(Operand, Operand),
    Lt(Operand, Operand),
    Eq(Operand, Operand),
    Ne(Operand, Operand),

    /// Boolean variable (cooldown.ready, buff.active, etc.)
    Var(VarId),
    /// Literal true/false
    Literal(bool),
}

/// An operand in a comparison.
#[derive(Debug, Clone)]
pub enum Operand {
    Var(VarId),
    Float(f64),
    Int(i32),
}

/// Variable identifier - indexes into RotationContext.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum VarId {
    // Resources
    Focus,
    FocusMax,
    FocusDeficit,

    // Time
    Time,
    GcdRemains,

    // Target
    TargetHealthPct,
    TargetTimeToDie,
    TargetCount,

    // Cooldowns (by slot index 0-15)
    CooldownReady(u8),
    CooldownRemains(u8),
    CooldownCharges(u8),

    // Buffs (by slot index 0-15)
    BuffActive(u8),
    BuffStacks(u8),
    BuffRemains(u8),

    // Debuffs (by slot index 0-15)
    DebuffActive(u8),
    DebuffStacks(u8),
    DebuffRemains(u8),

    // Pet
    PetActive,
}

impl VarId {
    pub fn is_bool(&self) -> bool {
        matches!(
            self,
            VarId::CooldownReady(_)
                | VarId::BuffActive(_)
                | VarId::DebuffActive(_)
                | VarId::PetActive
        )
    }

    pub fn is_int(&self) -> bool {
        matches!(
            self,
            VarId::TargetCount
                | VarId::CooldownCharges(_)
                | VarId::BuffStacks(_)
                | VarId::DebuffStacks(_)
        )
    }

    pub fn is_float(&self) -> bool {
        !self.is_bool() && !self.is_int()
    }
}

impl Rotation {
    /// Convert action list to a single AST node (chain of if-else).
    pub fn to_ast(&self) -> RotationNode {
        Self::actions_to_node(&self.actions, 0)
    }

    fn actions_to_node(actions: &[RotationAction], idx: usize) -> RotationNode {
        if idx >= actions.len() {
            return RotationNode::Wait;
        }

        let action = &actions[idx];
        let next = Self::actions_to_node(actions, idx + 1);

        match &action.condition {
            Some(cond) => RotationNode::If {
                cond: cond.clone(),
                then: Box::new(RotationNode::Cast(action.spell_id)),
                else_: Box::new(next),
            },
            None => RotationNode::Cast(action.spell_id),
        }
    }
}

/// Internal AST node for compilation.
#[derive(Debug, Clone)]
pub enum RotationNode {
    If {
        cond: Condition,
        then: Box<RotationNode>,
        else_: Box<RotationNode>,
    },
    /// Cast a spell (game spell ID, 0 = wait).
    Cast(u32),
    Wait,
}
