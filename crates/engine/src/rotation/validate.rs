//! Rotation validation.
//!
//! Provides validation for rotation definitions before compilation.

use std::collections::HashSet;

use serde::{Deserialize, Serialize};

#[cfg(feature = "wasm")]
use tsify::Tsify;

use super::ast::{Action, Expr, Rotation, ValueType, VarOp};

/// Result of validating a rotation.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub struct ValidationResult {
    /// Whether the rotation is valid.
    pub valid: bool,
    /// List of validation errors.
    pub errors: Vec<ValidationError>,
    /// List of validation warnings.
    pub warnings: Vec<ValidationWarning>,
}

impl ValidationResult {
    /// Create a successful validation result.
    pub fn ok() -> Self {
        Self {
            valid: true,
            errors: Vec::new(),
            warnings: Vec::new(),
        }
    }

    /// Create a failed validation result with errors.
    pub fn with_errors(errors: Vec<ValidationError>) -> Self {
        Self {
            valid: errors.is_empty(),
            errors,
            warnings: Vec::new(),
        }
    }
}

/// A validation error.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum ValidationError {
    /// Reference to an undefined variable.
    UndefinedVariable { name: String },
    /// Reference to an undefined list.
    UndefinedList { name: String },
    /// Circular variable reference.
    CircularReference { path: Vec<String> },
    /// Empty action list.
    EmptyActionList { list_name: String },
    /// Invalid expression.
    InvalidExpression { message: String },
    /// Duplicate variable definition.
    DuplicateVariable { name: String },
    /// Duplicate list definition.
    DuplicateList { name: String },
    /// Type mismatch in variable operation.
    TypeMismatch {
        /// Variable name.
        name: String,
        /// The operation being performed.
        op: String,
        /// Expected type(s).
        expected: String,
        /// Actual type.
        got: String,
    },
}

/// A validation warning.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum ValidationWarning {
    /// Variable is defined but never used.
    UnusedVariable { name: String },
    /// List is defined but never called.
    UnusedList { name: String },
    /// Condition always evaluates to true/false.
    ConstantCondition { value: bool, location: String },
}

/// Validate a rotation.
pub fn validate_rotation(rotation: &Rotation) -> ValidationResult {
    let mut errors = Vec::new();
    let mut warnings = Vec::new();

    // Collect all variable and list names
    let variable_names: HashSet<_> = rotation.variables.keys().cloned().collect();
    let list_names: HashSet<_> = rotation.lists.keys().cloned().collect();

    // Track used variables and lists
    let mut used_variables = HashSet::new();
    let mut used_lists = HashSet::new();

    // Check for empty main action list
    if rotation.actions.is_empty() {
        errors.push(ValidationError::EmptyActionList {
            list_name: "actions".to_string(),
        });
    }

    // Check for empty named lists
    for (name, actions) in &rotation.lists {
        if actions.is_empty() {
            errors.push(ValidationError::EmptyActionList {
                list_name: name.clone(),
            });
        }
    }

    // Validate main actions
    for action in &rotation.actions {
        validate_action(
            action,
            &variable_names,
            &list_names,
            &mut used_variables,
            &mut used_lists,
            &mut errors,
        );
    }

    // Validate list actions
    for actions in rotation.lists.values() {
        for action in actions {
            validate_action(
                action,
                &variable_names,
                &list_names,
                &mut used_variables,
                &mut used_lists,
                &mut errors,
            );
        }
    }

    // Validate variable expressions
    for (name, expr) in &rotation.variables {
        validate_expr(
            expr,
            &variable_names,
            &mut used_variables,
            &mut errors,
            &format!("variable '{}'", name),
        );
    }

    // Check for circular variable references
    for (name, expr) in &rotation.variables {
        let mut visited = HashSet::new();
        let mut path = vec![name.clone()];
        if has_circular_reference(name, expr, &rotation.variables, &mut visited, &mut path) {
            errors.push(ValidationError::CircularReference { path });
        }
    }

    // Check for unused variables
    for name in &variable_names {
        if !used_variables.contains(name) {
            warnings.push(ValidationWarning::UnusedVariable { name: name.clone() });
        }
    }

    // Check for unused lists
    for name in &list_names {
        if !used_lists.contains(name) {
            warnings.push(ValidationWarning::UnusedList { name: name.clone() });
        }
    }

    ValidationResult {
        valid: errors.is_empty(),
        errors,
        warnings,
    }
}

fn validate_action(
    action: &Action,
    variable_names: &HashSet<String>,
    list_names: &HashSet<String>,
    used_variables: &mut HashSet<String>,
    used_lists: &mut HashSet<String>,
    errors: &mut Vec<ValidationError>,
) {
    match action {
        Action::Cast { condition, .. }
        | Action::Wait { condition, .. }
        | Action::Pool { condition, .. }
        | Action::UseTrinket { condition, .. }
        | Action::UseItem { condition, .. } => {
            if let Some(cond) = condition {
                validate_expr(cond, variable_names, used_variables, errors, "condition");
            }
        }
        Action::Call { list, condition } | Action::Run { list, condition } => {
            if !list_names.contains(list) {
                errors.push(ValidationError::UndefinedList { name: list.clone() });
            } else {
                used_lists.insert(list.clone());
            }
            if let Some(cond) = condition {
                validate_expr(cond, variable_names, used_variables, errors, "condition");
            }
        }
        Action::SetVar {
            value, condition, ..
        } => {
            validate_expr(
                value,
                variable_names,
                used_variables,
                errors,
                "set_var value",
            );
            if let Some(cond) = condition {
                validate_expr(cond, variable_names, used_variables, errors, "condition");
            }
        }
        Action::ModifyVar {
            name,
            op,
            value,
            condition,
        } => {
            validate_expr(
                value,
                variable_names,
                used_variables,
                errors,
                "modify_var value",
            );
            if let Some(cond) = condition {
                validate_expr(cond, variable_names, used_variables, errors, "condition");
            }

            // Type check: arithmetic operations require numeric types
            let requires_numeric = matches!(
                op,
                VarOp::Add | VarOp::Sub | VarOp::Mul | VarOp::Div | VarOp::Min | VarOp::Max
            );

            if requires_numeric {
                let value_type = value.value_type();
                if value_type == ValueType::Bool {
                    errors.push(ValidationError::TypeMismatch {
                        name: name.clone(),
                        op: format!("{:?}", op).to_lowercase(),
                        expected: "int or float".to_string(),
                        got: "bool".to_string(),
                    });
                }
            }
        }
        Action::WaitUntil { condition } => {
            validate_expr(
                condition,
                variable_names,
                used_variables,
                errors,
                "wait_until condition",
            );
        }
    }
}

#[allow(clippy::only_used_in_recursion)]
fn validate_expr(
    expr: &Expr,
    variable_names: &HashSet<String>,
    used_variables: &mut HashSet<String>,
    errors: &mut Vec<ValidationError>,
    location: &str,
) {
    match expr {
        // Literals and domain expressions are always valid
        Expr::Bool { .. }
        | Expr::Int { .. }
        | Expr::Float { .. }
        | Expr::Resource(_)
        | Expr::Cooldown(_)
        | Expr::Buff(_)
        | Expr::Debuff(_)
        | Expr::Dot(_)
        | Expr::Combat(_)
        | Expr::Target(_)
        | Expr::Player(_)
        | Expr::Spell(_)
        | Expr::Talent(_)
        | Expr::Gcd(_)
        | Expr::Pet(_)
        | Expr::Enemy(_)
        | Expr::Equipped { .. }
        | Expr::TrinketReady { .. }
        | Expr::TrinketRemaining { .. } => {}

        Expr::UserVar { name } => {
            if !variable_names.contains(name) {
                errors.push(ValidationError::UndefinedVariable { name: name.clone() });
            } else {
                used_variables.insert(name.clone());
            }
        }

        Expr::And { operands } | Expr::Or { operands } => {
            for operand in operands {
                validate_expr(operand, variable_names, used_variables, errors, location);
            }
        }

        Expr::Not { operand }
        | Expr::Floor { operand }
        | Expr::Ceil { operand }
        | Expr::Abs { operand } => {
            validate_expr(operand, variable_names, used_variables, errors, location);
        }

        Expr::Gt { left, right }
        | Expr::Gte { left, right }
        | Expr::Lt { left, right }
        | Expr::Lte { left, right }
        | Expr::Eq { left, right }
        | Expr::Ne { left, right }
        | Expr::Add { left, right }
        | Expr::Sub { left, right }
        | Expr::Mul { left, right }
        | Expr::Div { left, right }
        | Expr::Mod { left, right }
        | Expr::Min { left, right }
        | Expr::Max { left, right } => {
            validate_expr(left, variable_names, used_variables, errors, location);
            validate_expr(right, variable_names, used_variables, errors, location);
        }
    }
}

fn has_circular_reference(
    target: &str,
    expr: &Expr,
    variables: &std::collections::HashMap<String, Expr>,
    visited: &mut HashSet<String>,
    path: &mut Vec<String>,
) -> bool {
    match expr {
        Expr::UserVar { name } => {
            if name == target && path.len() > 1 {
                return true;
            }
            if visited.contains(name) {
                return false;
            }
            visited.insert(name.clone());
            path.push(name.clone());
            if let Some(var_expr) = variables.get(name) {
                if has_circular_reference(target, var_expr, variables, visited, path) {
                    return true;
                }
            }
            path.pop();
            false
        }

        Expr::And { operands } | Expr::Or { operands } => operands
            .iter()
            .any(|e| has_circular_reference(target, e, variables, visited, path)),

        Expr::Not { operand }
        | Expr::Floor { operand }
        | Expr::Ceil { operand }
        | Expr::Abs { operand } => {
            has_circular_reference(target, operand, variables, visited, path)
        }

        Expr::Gt { left, right }
        | Expr::Gte { left, right }
        | Expr::Lt { left, right }
        | Expr::Lte { left, right }
        | Expr::Eq { left, right }
        | Expr::Ne { left, right }
        | Expr::Add { left, right }
        | Expr::Sub { left, right }
        | Expr::Mul { left, right }
        | Expr::Div { left, right }
        | Expr::Mod { left, right }
        | Expr::Min { left, right }
        | Expr::Max { left, right } => {
            has_circular_reference(target, left, variables, visited, path)
                || has_circular_reference(target, right, variables, visited, path)
        }

        // Domain expressions don't reference user variables, so no circular reference possible
        Expr::Bool { .. }
        | Expr::Int { .. }
        | Expr::Float { .. }
        | Expr::Resource(_)
        | Expr::Cooldown(_)
        | Expr::Buff(_)
        | Expr::Debuff(_)
        | Expr::Dot(_)
        | Expr::Combat(_)
        | Expr::Target(_)
        | Expr::Player(_)
        | Expr::Spell(_)
        | Expr::Talent(_)
        | Expr::Gcd(_)
        | Expr::Pet(_)
        | Expr::Enemy(_)
        | Expr::Equipped { .. }
        | Expr::TrinketReady { .. }
        | Expr::TrinketRemaining { .. } => false,
    }
}

/// VarPath category for UI organization.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub struct VarPathCategory {
    /// Category name.
    pub name: String,
    /// Category description.
    pub description: String,
    /// List of VarPath variants in this category.
    pub paths: Vec<VarPathInfo>,
}

/// Information about a VarPath variant.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub struct VarPathInfo {
    /// Variant name (e.g., "Resource", "BuffActive").
    pub name: String,
    /// Human-readable description.
    pub description: String,
    /// Value type ("bool", "int", "float").
    pub value_type: String,
    /// Whether this variant takes an argument.
    pub has_arg: bool,
    /// Argument name if has_arg is true.
    pub arg_name: Option<String>,
    /// Example path string.
    pub example: String,
}

/// Get categorized VarPath schema for UI.
pub fn get_var_path_schema() -> Vec<VarPathCategory> {
    vec![
        VarPathCategory {
            name: "Resource".to_string(),
            description: "Primary resource (focus, mana, etc.)".to_string(),
            paths: vec![
                VarPathInfo {
                    name: "Resource".to_string(),
                    description: "Current resource amount".to_string(),
                    value_type: "float".to_string(),
                    has_arg: true,
                    arg_name: Some("resource".to_string()),
                    example: "resource.focus".to_string(),
                },
                VarPathInfo {
                    name: "ResourceMax".to_string(),
                    description: "Maximum resource amount".to_string(),
                    value_type: "float".to_string(),
                    has_arg: true,
                    arg_name: Some("resource".to_string()),
                    example: "resource.focus.max".to_string(),
                },
                VarPathInfo {
                    name: "ResourceDeficit".to_string(),
                    description: "Deficit from max resource".to_string(),
                    value_type: "float".to_string(),
                    has_arg: true,
                    arg_name: Some("resource".to_string()),
                    example: "resource.focus.deficit".to_string(),
                },
                VarPathInfo {
                    name: "ResourcePercent".to_string(),
                    description: "Resource as percentage".to_string(),
                    value_type: "float".to_string(),
                    has_arg: true,
                    arg_name: Some("resource".to_string()),
                    example: "resource.focus.percent".to_string(),
                },
                VarPathInfo {
                    name: "ResourceRegen".to_string(),
                    description: "Resource regeneration rate".to_string(),
                    value_type: "float".to_string(),
                    has_arg: true,
                    arg_name: Some("resource".to_string()),
                    example: "resource.focus.regen".to_string(),
                },
            ],
        },
        VarPathCategory {
            name: "Player".to_string(),
            description: "Player health".to_string(),
            paths: vec![
                VarPathInfo {
                    name: "PlayerHealth".to_string(),
                    description: "Current player health".to_string(),
                    value_type: "float".to_string(),
                    has_arg: false,
                    arg_name: None,
                    example: "player.health".to_string(),
                },
                VarPathInfo {
                    name: "PlayerHealthMax".to_string(),
                    description: "Maximum player health".to_string(),
                    value_type: "float".to_string(),
                    has_arg: false,
                    arg_name: None,
                    example: "player.health.max".to_string(),
                },
                VarPathInfo {
                    name: "PlayerHealthPercent".to_string(),
                    description: "Player health percentage".to_string(),
                    value_type: "float".to_string(),
                    has_arg: false,
                    arg_name: None,
                    example: "player.health.percent".to_string(),
                },
            ],
        },
        VarPathCategory {
            name: "Cooldown".to_string(),
            description: "Spell cooldowns".to_string(),
            paths: vec![
                VarPathInfo {
                    name: "CdReady".to_string(),
                    description: "Cooldown is ready".to_string(),
                    value_type: "bool".to_string(),
                    has_arg: true,
                    arg_name: Some("spell".to_string()),
                    example: "cd.kill_command.ready".to_string(),
                },
                VarPathInfo {
                    name: "CdRemaining".to_string(),
                    description: "Time until cooldown ready".to_string(),
                    value_type: "float".to_string(),
                    has_arg: true,
                    arg_name: Some("spell".to_string()),
                    example: "cd.kill_command.remaining".to_string(),
                },
                VarPathInfo {
                    name: "CdDuration".to_string(),
                    description: "Base cooldown duration".to_string(),
                    value_type: "float".to_string(),
                    has_arg: true,
                    arg_name: Some("spell".to_string()),
                    example: "cd.kill_command.duration".to_string(),
                },
                VarPathInfo {
                    name: "CdCharges".to_string(),
                    description: "Current charges".to_string(),
                    value_type: "int".to_string(),
                    has_arg: true,
                    arg_name: Some("spell".to_string()),
                    example: "cd.barbed_shot.charges".to_string(),
                },
                VarPathInfo {
                    name: "CdChargesMax".to_string(),
                    description: "Maximum charges".to_string(),
                    value_type: "int".to_string(),
                    has_arg: true,
                    arg_name: Some("spell".to_string()),
                    example: "cd.barbed_shot.charges_max".to_string(),
                },
                VarPathInfo {
                    name: "CdRechargeTime".to_string(),
                    description: "Time until next charge".to_string(),
                    value_type: "float".to_string(),
                    has_arg: true,
                    arg_name: Some("spell".to_string()),
                    example: "cd.barbed_shot.recharge_time".to_string(),
                },
                VarPathInfo {
                    name: "CdFullRecharge".to_string(),
                    description: "Time until all charges".to_string(),
                    value_type: "float".to_string(),
                    has_arg: true,
                    arg_name: Some("spell".to_string()),
                    example: "cd.barbed_shot.full_recharge".to_string(),
                },
            ],
        },
        VarPathCategory {
            name: "Buff".to_string(),
            description: "Buffs on player".to_string(),
            paths: vec![
                VarPathInfo {
                    name: "BuffActive".to_string(),
                    description: "Buff is active".to_string(),
                    value_type: "bool".to_string(),
                    has_arg: true,
                    arg_name: Some("aura".to_string()),
                    example: "buff.bestial_wrath.active".to_string(),
                },
                VarPathInfo {
                    name: "BuffInactive".to_string(),
                    description: "Buff is not active".to_string(),
                    value_type: "bool".to_string(),
                    has_arg: true,
                    arg_name: Some("aura".to_string()),
                    example: "buff.bestial_wrath.inactive".to_string(),
                },
                VarPathInfo {
                    name: "BuffRemaining".to_string(),
                    description: "Time remaining on buff".to_string(),
                    value_type: "float".to_string(),
                    has_arg: true,
                    arg_name: Some("aura".to_string()),
                    example: "buff.bestial_wrath.remaining".to_string(),
                },
                VarPathInfo {
                    name: "BuffStacks".to_string(),
                    description: "Current buff stacks".to_string(),
                    value_type: "int".to_string(),
                    has_arg: true,
                    arg_name: Some("aura".to_string()),
                    example: "buff.frenzy.stacks".to_string(),
                },
                VarPathInfo {
                    name: "BuffStacksMax".to_string(),
                    description: "Maximum buff stacks".to_string(),
                    value_type: "int".to_string(),
                    has_arg: true,
                    arg_name: Some("aura".to_string()),
                    example: "buff.frenzy.stacks_max".to_string(),
                },
                VarPathInfo {
                    name: "BuffDuration".to_string(),
                    description: "Base buff duration".to_string(),
                    value_type: "float".to_string(),
                    has_arg: true,
                    arg_name: Some("aura".to_string()),
                    example: "buff.bestial_wrath.duration".to_string(),
                },
            ],
        },
        VarPathCategory {
            name: "Debuff".to_string(),
            description: "Debuffs on target".to_string(),
            paths: vec![
                VarPathInfo {
                    name: "DebuffActive".to_string(),
                    description: "Debuff is active on target".to_string(),
                    value_type: "bool".to_string(),
                    has_arg: true,
                    arg_name: Some("aura".to_string()),
                    example: "debuff.hunters_mark.active".to_string(),
                },
                VarPathInfo {
                    name: "DebuffInactive".to_string(),
                    description: "Debuff is not active".to_string(),
                    value_type: "bool".to_string(),
                    has_arg: true,
                    arg_name: Some("aura".to_string()),
                    example: "debuff.hunters_mark.inactive".to_string(),
                },
                VarPathInfo {
                    name: "DebuffRemaining".to_string(),
                    description: "Time remaining on debuff".to_string(),
                    value_type: "float".to_string(),
                    has_arg: true,
                    arg_name: Some("aura".to_string()),
                    example: "debuff.hunters_mark.remaining".to_string(),
                },
                VarPathInfo {
                    name: "DebuffStacks".to_string(),
                    description: "Current debuff stacks".to_string(),
                    value_type: "int".to_string(),
                    has_arg: true,
                    arg_name: Some("aura".to_string()),
                    example: "debuff.kill_shot.stacks".to_string(),
                },
                VarPathInfo {
                    name: "DebuffRefreshable".to_string(),
                    description: "Debuff can be refreshed".to_string(),
                    value_type: "bool".to_string(),
                    has_arg: true,
                    arg_name: Some("aura".to_string()),
                    example: "debuff.serpent_sting.refreshable".to_string(),
                },
            ],
        },
        VarPathCategory {
            name: "DoT".to_string(),
            description: "Damage over time effects".to_string(),
            paths: vec![
                VarPathInfo {
                    name: "DotTicking".to_string(),
                    description: "DoT is ticking on target".to_string(),
                    value_type: "bool".to_string(),
                    has_arg: true,
                    arg_name: Some("dot".to_string()),
                    example: "dot.serpent_sting.ticking".to_string(),
                },
                VarPathInfo {
                    name: "DotRemaining".to_string(),
                    description: "Time remaining on DoT".to_string(),
                    value_type: "float".to_string(),
                    has_arg: true,
                    arg_name: Some("dot".to_string()),
                    example: "dot.serpent_sting.remaining".to_string(),
                },
                VarPathInfo {
                    name: "DotRefreshable".to_string(),
                    description: "DoT can be refreshed".to_string(),
                    value_type: "bool".to_string(),
                    has_arg: true,
                    arg_name: Some("dot".to_string()),
                    example: "dot.serpent_sting.refreshable".to_string(),
                },
                VarPathInfo {
                    name: "DotTicksRemaining".to_string(),
                    description: "Number of ticks remaining".to_string(),
                    value_type: "int".to_string(),
                    has_arg: true,
                    arg_name: Some("dot".to_string()),
                    example: "dot.serpent_sting.ticks_remaining".to_string(),
                },
            ],
        },
        VarPathCategory {
            name: "Target".to_string(),
            description: "Target information".to_string(),
            paths: vec![
                VarPathInfo {
                    name: "TargetHealthPercent".to_string(),
                    description: "Target health percentage".to_string(),
                    value_type: "float".to_string(),
                    has_arg: false,
                    arg_name: None,
                    example: "target.health_percent".to_string(),
                },
                VarPathInfo {
                    name: "TargetTimeToDie".to_string(),
                    description: "Estimated time to die".to_string(),
                    value_type: "float".to_string(),
                    has_arg: false,
                    arg_name: None,
                    example: "target.time_to_die".to_string(),
                },
                VarPathInfo {
                    name: "TargetDistance".to_string(),
                    description: "Distance to target".to_string(),
                    value_type: "float".to_string(),
                    has_arg: false,
                    arg_name: None,
                    example: "target.distance".to_string(),
                },
            ],
        },
        VarPathCategory {
            name: "Enemy".to_string(),
            description: "Enemy information".to_string(),
            paths: vec![VarPathInfo {
                name: "EnemyCount".to_string(),
                description: "Number of enemies".to_string(),
                value_type: "int".to_string(),
                has_arg: false,
                arg_name: None,
                example: "enemy.count".to_string(),
            }],
        },
        VarPathCategory {
            name: "Combat".to_string(),
            description: "Combat timing".to_string(),
            paths: vec![
                VarPathInfo {
                    name: "CombatTime".to_string(),
                    description: "Time in combat".to_string(),
                    value_type: "float".to_string(),
                    has_arg: false,
                    arg_name: None,
                    example: "combat.time".to_string(),
                },
                VarPathInfo {
                    name: "CombatRemaining".to_string(),
                    description: "Time remaining in fight".to_string(),
                    value_type: "float".to_string(),
                    has_arg: false,
                    arg_name: None,
                    example: "combat.remaining".to_string(),
                },
            ],
        },
        VarPathCategory {
            name: "GCD".to_string(),
            description: "Global cooldown".to_string(),
            paths: vec![
                VarPathInfo {
                    name: "GcdRemaining".to_string(),
                    description: "Time remaining on GCD".to_string(),
                    value_type: "float".to_string(),
                    has_arg: false,
                    arg_name: None,
                    example: "gcd.remaining".to_string(),
                },
                VarPathInfo {
                    name: "GcdDuration".to_string(),
                    description: "Current GCD duration".to_string(),
                    value_type: "float".to_string(),
                    has_arg: false,
                    arg_name: None,
                    example: "gcd.duration".to_string(),
                },
            ],
        },
        VarPathCategory {
            name: "Pet".to_string(),
            description: "Pet information".to_string(),
            paths: vec![
                VarPathInfo {
                    name: "PetActive".to_string(),
                    description: "Pet is active".to_string(),
                    value_type: "bool".to_string(),
                    has_arg: false,
                    arg_name: None,
                    example: "pet.active".to_string(),
                },
                VarPathInfo {
                    name: "PetRemaining".to_string(),
                    description: "Pet duration remaining".to_string(),
                    value_type: "float".to_string(),
                    has_arg: false,
                    arg_name: None,
                    example: "pet.remaining".to_string(),
                },
                VarPathInfo {
                    name: "PetBuffActive".to_string(),
                    description: "Pet buff is active".to_string(),
                    value_type: "bool".to_string(),
                    has_arg: true,
                    arg_name: Some("aura".to_string()),
                    example: "pet.buff.frenzy.active".to_string(),
                },
            ],
        },
        VarPathCategory {
            name: "Talent".to_string(),
            description: "Talent checks".to_string(),
            paths: vec![VarPathInfo {
                name: "Talent".to_string(),
                description: "Talent is enabled".to_string(),
                value_type: "bool".to_string(),
                has_arg: true,
                arg_name: Some("name".to_string()),
                example: "talent.killer_instinct".to_string(),
            }],
        },
        VarPathCategory {
            name: "Equipment".to_string(),
            description: "Equipment and trinkets".to_string(),
            paths: vec![
                VarPathInfo {
                    name: "Equipped".to_string(),
                    description: "Item is equipped".to_string(),
                    value_type: "bool".to_string(),
                    has_arg: true,
                    arg_name: Some("item".to_string()),
                    example: "equipped.fearbreakers_dawn".to_string(),
                },
                VarPathInfo {
                    name: "TrinketReady".to_string(),
                    description: "Trinket is ready".to_string(),
                    value_type: "bool".to_string(),
                    has_arg: true,
                    arg_name: Some("slot".to_string()),
                    example: "trinket.1.ready".to_string(),
                },
                VarPathInfo {
                    name: "TrinketRemaining".to_string(),
                    description: "Trinket cooldown remaining".to_string(),
                    value_type: "float".to_string(),
                    has_arg: true,
                    arg_name: Some("slot".to_string()),
                    example: "trinket.1.remaining".to_string(),
                },
            ],
        },
        VarPathCategory {
            name: "Spell".to_string(),
            description: "Spell information".to_string(),
            paths: vec![
                VarPathInfo {
                    name: "SpellCost".to_string(),
                    description: "Resource cost of spell".to_string(),
                    value_type: "float".to_string(),
                    has_arg: true,
                    arg_name: Some("spell".to_string()),
                    example: "spell.kill_command.cost".to_string(),
                },
                VarPathInfo {
                    name: "SpellCastTime".to_string(),
                    description: "Cast time of spell".to_string(),
                    value_type: "float".to_string(),
                    has_arg: true,
                    arg_name: Some("spell".to_string()),
                    example: "spell.aimed_shot.cast_time".to_string(),
                },
            ],
        },
    ]
}
