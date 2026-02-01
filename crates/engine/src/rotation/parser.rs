use std::collections::HashMap;

use serde_json::Value;

use super::ast::{Action, Expr, Rotation, VarOp};
use super::error::{Error, Result};
use super::expr::{
    BuffExpr, CombatExpr, CooldownExpr, DebuffExpr, DotExpr, EnemyExpr, GcdExpr, PercentValue,
    PetExpr, PlayerExpr, ResourceExpr, SpellExpr, TalentExpr, TargetExpr,
};
use super::resolver::SpecResolver;

impl Rotation {
    /// Parse a rotation from JSON string without resolution.
    /// Variable paths remain as strings for later resolution.
    pub fn from_json(json: &str) -> Result<Self> {
        let value: Value = serde_json::from_str(json)?;
        Self::from_value_unresolved(&value)
    }

    /// Parse a rotation from JSON string and resolve names using the provided resolver.
    pub fn from_json_resolved(json: &str, resolver: &SpecResolver) -> Result<Self> {
        let value: Value = serde_json::from_str(json)?;
        Self::from_value_resolved(&value, resolver)
    }

    /// Parse from a JSON value without resolution.
    fn from_value_unresolved(value: &Value) -> Result<Self> {
        let obj = value
            .as_object()
            .ok_or_else(|| Error::Syntax("rotation must be an object".into()))?;

        let name = obj
            .get("name")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
            .unwrap_or_else(|| "Unnamed".to_string());

        // Parse variables
        let mut variables = HashMap::new();
        if let Some(vars) = obj.get("variables").and_then(|v| v.as_object()) {
            for (k, v) in vars {
                variables.insert(k.clone(), parse_expr_unresolved(v)?);
            }
        }

        // Parse lists
        let mut lists = HashMap::new();
        if let Some(ls) = obj.get("lists").and_then(|v| v.as_object()) {
            for (k, v) in ls {
                let arr = v
                    .as_array()
                    .ok_or_else(|| Error::Syntax(format!("list '{}' must be an array", k)))?;
                let mut actions = Vec::with_capacity(arr.len());
                for item in arr {
                    actions.push(parse_action_unresolved(item)?);
                }
                lists.insert(k.clone(), actions);
            }
        }

        // Parse actions
        let mut actions = Vec::new();
        if let Some(arr) = obj.get("actions").and_then(|v| v.as_array()) {
            for item in arr {
                actions.push(parse_action_unresolved(item)?);
            }
        }

        Ok(Rotation {
            name,
            variables,
            lists,
            actions,
        })
    }

    /// Parse from a JSON value with name resolution.
    fn from_value_resolved(value: &Value, resolver: &SpecResolver) -> Result<Self> {
        let obj = value
            .as_object()
            .ok_or_else(|| Error::Syntax("rotation must be an object".into()))?;

        let name = obj
            .get("name")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
            .unwrap_or_else(|| "Unnamed".to_string());

        // Parse variables
        let mut variables = HashMap::new();
        if let Some(vars) = obj.get("variables").and_then(|v| v.as_object()) {
            for (k, v) in vars {
                variables.insert(k.clone(), parse_expr_resolved(v, resolver)?);
            }
        }

        // Parse lists
        let mut lists = HashMap::new();
        if let Some(ls) = obj.get("lists").and_then(|v| v.as_object()) {
            for (k, v) in ls {
                let arr = v
                    .as_array()
                    .ok_or_else(|| Error::Syntax(format!("list '{}' must be an array", k)))?;
                let mut actions = Vec::with_capacity(arr.len());
                for item in arr {
                    actions.push(parse_action_resolved(item, resolver)?);
                }
                lists.insert(k.clone(), actions);
            }
        }

        // Parse actions
        let mut actions = Vec::new();
        if let Some(arr) = obj.get("actions").and_then(|v| v.as_array()) {
            for item in arr {
                actions.push(parse_action_resolved(item, resolver)?);
            }
        }

        Ok(Rotation {
            name,
            variables,
            lists,
            actions,
        })
    }
}

fn parse_action_unresolved(value: &Value) -> Result<Action> {
    let obj = value
        .as_object()
        .ok_or_else(|| Error::Syntax("action must be an object".into()))?;

    let condition = obj.get("if").map(parse_expr_unresolved).transpose()?;

    // Cast spell
    if let Some(spell) = obj.get("cast").and_then(|v| v.as_str()) {
        return Ok(Action::Cast {
            spell: spell.to_string(),
            condition,
        });
    }

    // Call list
    if let Some(list) = obj.get("call").and_then(|v| v.as_str()) {
        return Ok(Action::Call {
            list: list.to_string(),
            condition,
        });
    }

    // Run list
    if let Some(list) = obj.get("run").and_then(|v| v.as_str()) {
        return Ok(Action::Run {
            list: list.to_string(),
            condition,
        });
    }

    // Set variable
    if let Some(name) = obj.get("set").and_then(|v| v.as_str()) {
        let value = obj
            .get("value")
            .ok_or_else(|| Error::Syntax("set requires 'value'".into()))?;
        return Ok(Action::SetVar {
            name: name.to_string(),
            value: parse_expr_unresolved(value)?,
            condition,
        });
    }

    // Modify variable
    if let Some(name) = obj.get("modify").and_then(|v| v.as_str()) {
        let op_str = obj
            .get("op")
            .and_then(|v| v.as_str())
            .ok_or_else(|| Error::Syntax("modify requires 'op'".into()))?;
        let op = parse_var_op(op_str)?;
        let value = obj
            .get("value")
            .ok_or_else(|| Error::Syntax("modify requires 'value'".into()))?;
        return Ok(Action::ModifyVar {
            name: name.to_string(),
            op,
            value: parse_expr_unresolved(value)?,
            condition,
        });
    }

    // Wait
    if let Some(seconds) = obj.get("wait") {
        let seconds = seconds
            .as_f64()
            .ok_or_else(|| Error::Syntax("wait requires number".into()))?;
        return Ok(Action::Wait { seconds, condition });
    }

    // Wait until
    if let Some(cond) = obj.get("wait_until") {
        return Ok(Action::WaitUntil {
            condition: parse_expr_unresolved(cond)?,
        });
    }

    // Pool
    if obj.get("pool").is_some() {
        let extra = obj.get("extra").and_then(|v| v.as_f64());
        return Ok(Action::Pool { extra, condition });
    }

    // Use trinket
    if let Some(slot) = obj.get("use_trinket") {
        let slot = slot
            .as_u64()
            .ok_or_else(|| Error::Syntax("use_trinket requires number".into()))?
            as u8;
        return Ok(Action::UseTrinket { slot, condition });
    }

    // Use item
    if let Some(name) = obj.get("use_item").and_then(|v| v.as_str()) {
        return Ok(Action::UseItem {
            name: name.to_string(),
            condition,
        });
    }

    Err(Error::Syntax("unknown action type".into()))
}

fn parse_expr_unresolved(value: &Value) -> Result<Expr> {
    match value {
        Value::Bool(b) => Ok(Expr::Bool { value: *b }),

        Value::Number(n) => {
            if let Some(i) = n.as_i64() {
                Ok(Expr::Int { value: i })
            } else if let Some(f) = n.as_f64() {
                Ok(Expr::Float { value: f })
            } else {
                Err(Error::Syntax("invalid number".into()))
            }
        }

        // String is a variable path or user variable - store as UserVar for now
        Value::String(s) => Ok(Expr::UserVar { name: s.clone() }),

        Value::Object(obj) => parse_expr_object_unresolved(obj),

        _ => Err(Error::Syntax(format!("unexpected value: {:?}", value))),
    }
}

fn parse_expr_object_unresolved(obj: &serde_json::Map<String, Value>) -> Result<Expr> {
    if obj.len() != 1 {
        return Err(Error::Syntax(format!(
            "expression object must have exactly 1 key, got {}",
            obj.len()
        )));
    }

    let (op, args) = obj.iter().next().unwrap();

    match op.as_str() {
        // Logical
        "and" => {
            let arr = require_array(args, "and")?;
            if arr.len() < 2 {
                return Err(Error::ArgCount {
                    op: "and",
                    expected: 2,
                    got: arr.len(),
                });
            }
            let operands: Result<Vec<_>> = arr.iter().map(parse_expr_unresolved).collect();
            Ok(Expr::And {
                operands: operands?,
            })
        }

        "or" => {
            let arr = require_array(args, "or")?;
            if arr.len() < 2 {
                return Err(Error::ArgCount {
                    op: "or",
                    expected: 2,
                    got: arr.len(),
                });
            }
            let operands: Result<Vec<_>> = arr.iter().map(parse_expr_unresolved).collect();
            Ok(Expr::Or {
                operands: operands?,
            })
        }

        "not" => {
            let inner = if args.is_array() {
                &args.as_array().unwrap()[0]
            } else {
                args
            };
            Ok(Expr::Not {
                operand: Box::new(parse_expr_unresolved(inner)?),
            })
        }

        // Comparison
        ">" => {
            let (a, b) = require_binary(args, ">")?;
            Ok(Expr::Gt {
                left: Box::new(parse_expr_unresolved(a)?),
                right: Box::new(parse_expr_unresolved(b)?),
            })
        }
        ">=" => {
            let (a, b) = require_binary(args, ">=")?;
            Ok(Expr::Gte {
                left: Box::new(parse_expr_unresolved(a)?),
                right: Box::new(parse_expr_unresolved(b)?),
            })
        }
        "<" => {
            let (a, b) = require_binary(args, "<")?;
            Ok(Expr::Lt {
                left: Box::new(parse_expr_unresolved(a)?),
                right: Box::new(parse_expr_unresolved(b)?),
            })
        }
        "<=" => {
            let (a, b) = require_binary(args, "<=")?;
            Ok(Expr::Lte {
                left: Box::new(parse_expr_unresolved(a)?),
                right: Box::new(parse_expr_unresolved(b)?),
            })
        }
        "==" => {
            let (a, b) = require_binary(args, "==")?;
            Ok(Expr::Eq {
                left: Box::new(parse_expr_unresolved(a)?),
                right: Box::new(parse_expr_unresolved(b)?),
            })
        }
        "!=" => {
            let (a, b) = require_binary(args, "!=")?;
            Ok(Expr::Ne {
                left: Box::new(parse_expr_unresolved(a)?),
                right: Box::new(parse_expr_unresolved(b)?),
            })
        }

        // Arithmetic
        "+" => {
            let (a, b) = require_binary(args, "+")?;
            Ok(Expr::Add {
                left: Box::new(parse_expr_unresolved(a)?),
                right: Box::new(parse_expr_unresolved(b)?),
            })
        }
        "-" => {
            let (a, b) = require_binary(args, "-")?;
            Ok(Expr::Sub {
                left: Box::new(parse_expr_unresolved(a)?),
                right: Box::new(parse_expr_unresolved(b)?),
            })
        }
        "*" => {
            let (a, b) = require_binary(args, "*")?;
            Ok(Expr::Mul {
                left: Box::new(parse_expr_unresolved(a)?),
                right: Box::new(parse_expr_unresolved(b)?),
            })
        }
        "/" => {
            let (a, b) = require_binary(args, "/")?;
            Ok(Expr::Div {
                left: Box::new(parse_expr_unresolved(a)?),
                right: Box::new(parse_expr_unresolved(b)?),
            })
        }
        "%" => {
            let (a, b) = require_binary(args, "%")?;
            Ok(Expr::Mod {
                left: Box::new(parse_expr_unresolved(a)?),
                right: Box::new(parse_expr_unresolved(b)?),
            })
        }

        // Functions
        "floor" => Ok(Expr::Floor {
            operand: Box::new(parse_expr_unresolved(args)?),
        }),
        "ceil" => Ok(Expr::Ceil {
            operand: Box::new(parse_expr_unresolved(args)?),
        }),
        "abs" => Ok(Expr::Abs {
            operand: Box::new(parse_expr_unresolved(args)?),
        }),
        "min" => {
            let (a, b) = require_binary(args, "min")?;
            Ok(Expr::Min {
                left: Box::new(parse_expr_unresolved(a)?),
                right: Box::new(parse_expr_unresolved(b)?),
            })
        }
        "max" => {
            let (a, b) = require_binary(args, "max")?;
            Ok(Expr::Max {
                left: Box::new(parse_expr_unresolved(a)?),
                right: Box::new(parse_expr_unresolved(b)?),
            })
        }

        _ => Err(Error::UnknownOperator(op.clone())),
    }
}

fn parse_action_resolved(value: &Value, resolver: &SpecResolver) -> Result<Action> {
    let obj = value
        .as_object()
        .ok_or_else(|| Error::Syntax("action must be an object".into()))?;

    let condition = obj
        .get("if")
        .map(|v| parse_expr_resolved(v, resolver))
        .transpose()?;

    // Cast spell
    if let Some(spell) = obj.get("cast").and_then(|v| v.as_str()) {
        // Validate spell exists
        resolver.resolve_spell(spell)?;
        return Ok(Action::Cast {
            spell: spell.to_string(),
            condition,
        });
    }

    // Call list
    if let Some(list) = obj.get("call").and_then(|v| v.as_str()) {
        return Ok(Action::Call {
            list: list.to_string(),
            condition,
        });
    }

    // Run list
    if let Some(list) = obj.get("run").and_then(|v| v.as_str()) {
        return Ok(Action::Run {
            list: list.to_string(),
            condition,
        });
    }

    // Set variable
    if let Some(name) = obj.get("set").and_then(|v| v.as_str()) {
        let value = obj
            .get("value")
            .ok_or_else(|| Error::Syntax("set requires 'value'".into()))?;
        return Ok(Action::SetVar {
            name: name.to_string(),
            value: parse_expr_resolved(value, resolver)?,
            condition,
        });
    }

    // Modify variable
    if let Some(name) = obj.get("modify").and_then(|v| v.as_str()) {
        let op_str = obj
            .get("op")
            .and_then(|v| v.as_str())
            .ok_or_else(|| Error::Syntax("modify requires 'op'".into()))?;
        let op = parse_var_op(op_str)?;
        let value = obj
            .get("value")
            .ok_or_else(|| Error::Syntax("modify requires 'value'".into()))?;
        return Ok(Action::ModifyVar {
            name: name.to_string(),
            op,
            value: parse_expr_resolved(value, resolver)?,
            condition,
        });
    }

    // Wait
    if let Some(seconds) = obj.get("wait") {
        let seconds = seconds
            .as_f64()
            .ok_or_else(|| Error::Syntax("wait requires number".into()))?;
        return Ok(Action::Wait { seconds, condition });
    }

    // Wait until
    if let Some(cond) = obj.get("wait_until") {
        return Ok(Action::WaitUntil {
            condition: parse_expr_resolved(cond, resolver)?,
        });
    }

    // Pool
    if obj.get("pool").is_some() {
        let extra = obj.get("extra").and_then(|v| v.as_f64());
        return Ok(Action::Pool { extra, condition });
    }

    // Use trinket
    if let Some(slot) = obj.get("use_trinket") {
        let slot = slot
            .as_u64()
            .ok_or_else(|| Error::Syntax("use_trinket requires number".into()))?
            as u8;
        return Ok(Action::UseTrinket { slot, condition });
    }

    // Use item
    if let Some(name) = obj.get("use_item").and_then(|v| v.as_str()) {
        return Ok(Action::UseItem {
            name: name.to_string(),
            condition,
        });
    }

    Err(Error::Syntax("unknown action type".into()))
}

fn parse_expr_resolved(value: &Value, resolver: &SpecResolver) -> Result<Expr> {
    match value {
        Value::Bool(b) => Ok(Expr::Bool { value: *b }),

        Value::Number(n) => {
            if let Some(i) = n.as_i64() {
                Ok(Expr::Int { value: i })
            } else if let Some(f) = n.as_f64() {
                Ok(Expr::Float { value: f })
            } else {
                Err(Error::Syntax("invalid number".into()))
            }
        }

        // String is a variable path or user variable
        Value::String(s) => parse_var_path_resolved(s, resolver),

        Value::Object(obj) => parse_expr_object_resolved(obj, resolver),

        _ => Err(Error::Syntax(format!("unexpected value: {:?}", value))),
    }
}

fn parse_expr_object_resolved(
    obj: &serde_json::Map<String, Value>,
    resolver: &SpecResolver,
) -> Result<Expr> {
    if obj.len() != 1 {
        return Err(Error::Syntax(format!(
            "expression object must have exactly 1 key, got {}",
            obj.len()
        )));
    }

    let (op, args) = obj.iter().next().unwrap();

    match op.as_str() {
        // Logical
        "and" => {
            let arr = require_array(args, "and")?;
            if arr.len() < 2 {
                return Err(Error::ArgCount {
                    op: "and",
                    expected: 2,
                    got: arr.len(),
                });
            }
            let operands: Result<Vec<_>> = arr
                .iter()
                .map(|v| parse_expr_resolved(v, resolver))
                .collect();
            Ok(Expr::And {
                operands: operands?,
            })
        }

        "or" => {
            let arr = require_array(args, "or")?;
            if arr.len() < 2 {
                return Err(Error::ArgCount {
                    op: "or",
                    expected: 2,
                    got: arr.len(),
                });
            }
            let operands: Result<Vec<_>> = arr
                .iter()
                .map(|v| parse_expr_resolved(v, resolver))
                .collect();
            Ok(Expr::Or {
                operands: operands?,
            })
        }

        "not" => {
            let inner = if args.is_array() {
                &args.as_array().unwrap()[0]
            } else {
                args
            };
            Ok(Expr::Not {
                operand: Box::new(parse_expr_resolved(inner, resolver)?),
            })
        }

        // Comparison
        ">" => {
            let (a, b) = require_binary(args, ">")?;
            Ok(Expr::Gt {
                left: Box::new(parse_expr_resolved(a, resolver)?),
                right: Box::new(parse_expr_resolved(b, resolver)?),
            })
        }
        ">=" => {
            let (a, b) = require_binary(args, ">=")?;
            Ok(Expr::Gte {
                left: Box::new(parse_expr_resolved(a, resolver)?),
                right: Box::new(parse_expr_resolved(b, resolver)?),
            })
        }
        "<" => {
            let (a, b) = require_binary(args, "<")?;
            Ok(Expr::Lt {
                left: Box::new(parse_expr_resolved(a, resolver)?),
                right: Box::new(parse_expr_resolved(b, resolver)?),
            })
        }
        "<=" => {
            let (a, b) = require_binary(args, "<=")?;
            Ok(Expr::Lte {
                left: Box::new(parse_expr_resolved(a, resolver)?),
                right: Box::new(parse_expr_resolved(b, resolver)?),
            })
        }
        "==" => {
            let (a, b) = require_binary(args, "==")?;
            Ok(Expr::Eq {
                left: Box::new(parse_expr_resolved(a, resolver)?),
                right: Box::new(parse_expr_resolved(b, resolver)?),
            })
        }
        "!=" => {
            let (a, b) = require_binary(args, "!=")?;
            Ok(Expr::Ne {
                left: Box::new(parse_expr_resolved(a, resolver)?),
                right: Box::new(parse_expr_resolved(b, resolver)?),
            })
        }

        // Arithmetic
        "+" => {
            let (a, b) = require_binary(args, "+")?;
            Ok(Expr::Add {
                left: Box::new(parse_expr_resolved(a, resolver)?),
                right: Box::new(parse_expr_resolved(b, resolver)?),
            })
        }
        "-" => {
            let (a, b) = require_binary(args, "-")?;
            Ok(Expr::Sub {
                left: Box::new(parse_expr_resolved(a, resolver)?),
                right: Box::new(parse_expr_resolved(b, resolver)?),
            })
        }
        "*" => {
            let (a, b) = require_binary(args, "*")?;
            Ok(Expr::Mul {
                left: Box::new(parse_expr_resolved(a, resolver)?),
                right: Box::new(parse_expr_resolved(b, resolver)?),
            })
        }
        "/" => {
            let (a, b) = require_binary(args, "/")?;
            Ok(Expr::Div {
                left: Box::new(parse_expr_resolved(a, resolver)?),
                right: Box::new(parse_expr_resolved(b, resolver)?),
            })
        }
        "%" => {
            let (a, b) = require_binary(args, "%")?;
            Ok(Expr::Mod {
                left: Box::new(parse_expr_resolved(a, resolver)?),
                right: Box::new(parse_expr_resolved(b, resolver)?),
            })
        }

        // Functions
        "floor" => Ok(Expr::Floor {
            operand: Box::new(parse_expr_resolved(args, resolver)?),
        }),
        "ceil" => Ok(Expr::Ceil {
            operand: Box::new(parse_expr_resolved(args, resolver)?),
        }),
        "abs" => Ok(Expr::Abs {
            operand: Box::new(parse_expr_resolved(args, resolver)?),
        }),
        "min" => {
            let (a, b) = require_binary(args, "min")?;
            Ok(Expr::Min {
                left: Box::new(parse_expr_resolved(a, resolver)?),
                right: Box::new(parse_expr_resolved(b, resolver)?),
            })
        }
        "max" => {
            let (a, b) = require_binary(args, "max")?;
            Ok(Expr::Max {
                left: Box::new(parse_expr_resolved(a, resolver)?),
                right: Box::new(parse_expr_resolved(b, resolver)?),
            })
        }

        _ => Err(Error::UnknownOperator(op.clone())),
    }
}

/// Parse a variable path string and resolve to the appropriate Expr variant.
fn parse_var_path_resolved(s: &str, resolver: &SpecResolver) -> Result<Expr> {
    let parts: Vec<&str> = s.split('.').collect();

    match parts.as_slice() {
        // resource.*
        ["resource", name] => {
            let resource = super::resolver::check_resource(name, resolver)?;
            Ok(Expr::Resource(ResourceExpr::ResourceCurrent { resource }))
        }
        ["resource", name, "max"] => {
            let resource = super::resolver::check_resource(name, resolver)?;
            Ok(Expr::Resource(ResourceExpr::ResourceMax { resource }))
        }
        ["resource", name, "deficit"] => {
            let resource = super::resolver::check_resource(name, resolver)?;
            Ok(Expr::Resource(ResourceExpr::ResourceDeficit { resource }))
        }
        ["resource", name, "percent"] => {
            let resource = super::resolver::check_resource(name, resolver)?;
            Ok(Expr::Resource(ResourceExpr::ResourcePercent { resource }))
        }
        ["resource", name, "regen"] => {
            let resource = super::resolver::check_resource(name, resolver)?;
            Ok(Expr::Resource(ResourceExpr::ResourceRegen { resource }))
        }
        ["resource", name, "current"] => {
            let resource = super::resolver::check_resource(name, resolver)?;
            Ok(Expr::Resource(ResourceExpr::ResourceCurrent { resource }))
        }
        ["resource", name, "deficit_percent"] => {
            let resource = super::resolver::check_resource(name, resolver)?;
            Ok(Expr::Resource(ResourceExpr::ResourceDeficitPercent {
                resource,
            }))
        }
        ["resource", name, "time_to_max"] => {
            let resource = super::resolver::check_resource(name, resolver)?;
            Ok(Expr::Resource(ResourceExpr::ResourceTimeToMax { resource }))
        }

        // player.*
        ["player", "health"] => Ok(Expr::Player(PlayerExpr::Health)),
        ["player", "health", "max"] => Ok(Expr::Player(PlayerExpr::HealthMax)),
        ["player", "health", "percent"] => Ok(Expr::Player(PlayerExpr::HealthPercent)),
        ["player", "health", "deficit"] => Ok(Expr::Player(PlayerExpr::HealthDeficit)),
        ["player", "haste"] => Ok(Expr::Player(PlayerExpr::Haste)),
        ["player", "crit"] => Ok(Expr::Player(PlayerExpr::Crit)),
        ["player", "mastery"] => Ok(Expr::Player(PlayerExpr::Mastery)),
        ["player", "versatility"] => Ok(Expr::Player(PlayerExpr::Versatility)),
        ["player", "attack_power"] => Ok(Expr::Player(PlayerExpr::AttackPower)),
        ["player", "spell_power"] => Ok(Expr::Player(PlayerExpr::SpellPower)),
        ["player", "level"] => Ok(Expr::Player(PlayerExpr::Level)),
        ["player", "armor"] => Ok(Expr::Player(PlayerExpr::Armor)),
        ["player", "stamina"] => Ok(Expr::Player(PlayerExpr::Stamina)),
        ["player", "primary_stat"] => Ok(Expr::Player(PlayerExpr::PrimaryStat)),
        ["player", "moving"] => Ok(Expr::Player(PlayerExpr::Moving)),
        ["player", "movement_remaining"] => Ok(Expr::Player(PlayerExpr::MovementRemaining)),
        ["player", "alive"] => Ok(Expr::Player(PlayerExpr::Alive)),
        ["player", "in_combat"] => Ok(Expr::Player(PlayerExpr::InCombat)),
        ["player", "stealthed"] => Ok(Expr::Player(PlayerExpr::Stealthed)),
        ["player", "mounted"] => Ok(Expr::Player(PlayerExpr::Mounted)),

        // cd.*
        ["cd", spell, "ready"] => {
            let id = resolver.resolve_spell(spell)?;
            Ok(Expr::Cooldown(CooldownExpr::CooldownReady { spell: id }))
        }
        ["cd", spell, "remaining"] => {
            let id = resolver.resolve_spell(spell)?;
            Ok(Expr::Cooldown(CooldownExpr::CooldownRemaining {
                spell: id,
            }))
        }
        ["cd", spell, "duration"] => {
            let id = resolver.resolve_spell(spell)?;
            Ok(Expr::Cooldown(CooldownExpr::CooldownDuration { spell: id }))
        }
        ["cd", spell, "base_duration"] => {
            let id = resolver.resolve_spell(spell)?;
            Ok(Expr::Cooldown(CooldownExpr::CooldownBaseDuration {
                spell: id,
            }))
        }
        ["cd", spell, "charges"] => {
            let id = resolver.resolve_spell(spell)?;
            Ok(Expr::Cooldown(CooldownExpr::CooldownCharges { spell: id }))
        }
        ["cd", spell, "charges_max"] => {
            let id = resolver.resolve_spell(spell)?;
            Ok(Expr::Cooldown(CooldownExpr::CooldownChargesMax {
                spell: id,
            }))
        }
        ["cd", spell, "charges_fractional"] => {
            let id = resolver.resolve_spell(spell)?;
            Ok(Expr::Cooldown(CooldownExpr::CooldownChargesFractional {
                spell: id,
            }))
        }
        ["cd", spell, "recharge_time"] => {
            let id = resolver.resolve_spell(spell)?;
            Ok(Expr::Cooldown(CooldownExpr::CooldownRechargeTime {
                spell: id,
            }))
        }
        ["cd", spell, "full_recharge"] | ["cd", spell, "full_recharge_time"] => {
            let id = resolver.resolve_spell(spell)?;
            Ok(Expr::Cooldown(CooldownExpr::CooldownFullRechargeTime {
                spell: id,
            }))
        }

        // buff.*
        ["buff", name, "active"] => {
            let id = resolver.resolve_aura(name)?;
            Ok(Expr::Buff(BuffExpr::Active { aura: id }))
        }
        ["buff", name, "inactive"] => {
            let id = resolver.resolve_aura(name)?;
            Ok(Expr::Buff(BuffExpr::Inactive { aura: id }))
        }
        ["buff", name, "remaining"] => {
            let id = resolver.resolve_aura(name)?;
            Ok(Expr::Buff(BuffExpr::Remaining { aura: id }))
        }
        ["buff", name, "stacks"] => {
            let id = resolver.resolve_aura(name)?;
            Ok(Expr::Buff(BuffExpr::Stacks { aura: id }))
        }
        ["buff", name, "stacks_max"] => {
            let id = resolver.resolve_aura(name)?;
            Ok(Expr::Buff(BuffExpr::StacksMax { aura: id }))
        }
        ["buff", name, "duration"] => {
            let id = resolver.resolve_aura(name)?;
            Ok(Expr::Buff(BuffExpr::Duration { aura: id }))
        }

        // debuff.*
        ["debuff", name, "active"] => {
            let id = resolver.resolve_aura(name)?;
            Ok(Expr::Debuff(DebuffExpr::Active { aura: id }))
        }
        ["debuff", name, "inactive"] => {
            let id = resolver.resolve_aura(name)?;
            Ok(Expr::Debuff(DebuffExpr::Inactive { aura: id }))
        }
        ["debuff", name, "remaining"] => {
            let id = resolver.resolve_aura(name)?;
            Ok(Expr::Debuff(DebuffExpr::Remaining { aura: id }))
        }
        ["debuff", name, "stacks"] => {
            let id = resolver.resolve_aura(name)?;
            Ok(Expr::Debuff(DebuffExpr::Stacks { aura: id }))
        }
        ["debuff", name, "refreshable"] => {
            let id = resolver.resolve_aura(name)?;
            Ok(Expr::Debuff(DebuffExpr::Refreshable { aura: id }))
        }

        // dot.*
        ["dot", name, "ticking"] => {
            let id = resolver.resolve_dot(name)?;
            Ok(Expr::Dot(DotExpr::Ticking { aura: id }))
        }
        ["dot", name, "remaining"] => {
            let id = resolver.resolve_dot(name)?;
            Ok(Expr::Dot(DotExpr::Remaining { aura: id }))
        }
        ["dot", name, "refreshable"] => {
            let id = resolver.resolve_dot(name)?;
            Ok(Expr::Dot(DotExpr::Refreshable { aura: id }))
        }
        ["dot", name, "ticks_remaining"] => {
            let id = resolver.resolve_dot(name)?;
            Ok(Expr::Dot(DotExpr::TicksRemaining { aura: id }))
        }

        // target.*
        ["target", "health"] => Ok(Expr::Target(TargetExpr::Health)),
        ["target", "health_max"] => Ok(Expr::Target(TargetExpr::HealthMax)),
        ["target", "health_percent"] => Ok(Expr::Target(TargetExpr::HealthPercent)),
        ["target", "time_to_die"] => Ok(Expr::Target(TargetExpr::TimeToDie)),
        ["target", "time_to_percent", pct] => {
            let percent: f64 = pct
                .parse()
                .map_err(|_| Error::Syntax(format!("invalid percent: {}", pct)))?;
            Ok(Expr::Target(TargetExpr::TimeToPercent {
                percent: PercentValue(percent),
            }))
        }
        ["target", "distance"] => Ok(Expr::Target(TargetExpr::Distance)),
        ["target", "casting"] => Ok(Expr::Target(TargetExpr::Casting)),
        ["target", "moving"] => Ok(Expr::Target(TargetExpr::Moving)),

        // enemy.*
        ["enemy", "count"] => Ok(Expr::Target(TargetExpr::EnemyCount)),
        ["enemy", "spell_targets_hit", spell] => {
            let id = resolver.resolve_spell(spell)?;
            Ok(Expr::Enemy(EnemyExpr::SpellTargetsHit { spell: id }))
        }

        // combat.*
        ["combat", "time"] => Ok(Expr::Combat(CombatExpr::Time)),
        ["combat", "remaining"] => Ok(Expr::Combat(CombatExpr::Remaining)),

        // gcd.*
        ["gcd", "active"] => Ok(Expr::Gcd(GcdExpr::Active)),
        ["gcd", "remaining"] => Ok(Expr::Gcd(GcdExpr::Remaining)),
        ["gcd", "duration"] => Ok(Expr::Gcd(GcdExpr::Duration)),

        // pet.*
        ["pet", "active"] => Ok(Expr::Pet(PetExpr::Active)),
        ["pet", "count"] => Ok(Expr::Pet(PetExpr::Count)),
        ["pet", "remaining"] => Ok(Expr::Pet(PetExpr::Remaining)),
        ["pet", "buff", name, "active"] => {
            let id = resolver.resolve_aura(name)?;
            Ok(Expr::Pet(PetExpr::BuffActive { aura: id }))
        }

        // talent.* (enabled is default, rank and max_rank are explicit)
        ["talent", name] => {
            let enabled = resolver.resolve_talent(name)?;
            Ok(Expr::Talent(TalentExpr::Enabled { value: enabled }))
        }
        ["talent", name, "enabled"] => {
            let enabled = resolver.resolve_talent(name)?;
            Ok(Expr::Talent(TalentExpr::Enabled { value: enabled }))
        }
        ["talent", name, "rank"] => {
            let info = resolver.resolve_talent_info(name)?;
            Ok(Expr::Talent(TalentExpr::Rank { rank: info.rank }))
        }
        ["talent", name, "max_rank"] => {
            let info = resolver.resolve_talent_info(name)?;
            Ok(Expr::Talent(TalentExpr::MaxRank {
                max_rank: info.max_rank,
            }))
        }

        // equipped.*
        ["equipped", name] => Ok(Expr::Equipped {
            item: name.to_string(),
        }),

        // trinket.*
        ["trinket", slot, "ready"] => {
            let slot: u8 = slot
                .parse()
                .map_err(|_| Error::Syntax(format!("invalid trinket slot: {}", slot)))?;
            Ok(Expr::TrinketReady { slot })
        }
        ["trinket", slot, "remaining"] => {
            let slot: u8 = slot
                .parse()
                .map_err(|_| Error::Syntax(format!("invalid trinket slot: {}", slot)))?;
            Ok(Expr::TrinketRemaining { slot })
        }

        // spell.*
        ["spell", name, "cost"] => {
            let id = resolver.resolve_spell(name)?;
            Ok(Expr::Spell(SpellExpr::Cost { spell: id }))
        }
        ["spell", name, "cast_time"] => {
            let id = resolver.resolve_spell(name)?;
            Ok(Expr::Spell(SpellExpr::CastTime { spell: id }))
        }
        ["spell", name, "range"] => {
            let id = resolver.resolve_spell(name)?;
            Ok(Expr::Spell(SpellExpr::Range { spell: id }))
        }
        ["spell", name, "in_range"] => {
            let id = resolver.resolve_spell(name)?;
            Ok(Expr::Spell(SpellExpr::InRange { spell: id }))
        }
        ["spell", name, "usable"] => {
            let id = resolver.resolve_spell(name)?;
            Ok(Expr::Spell(SpellExpr::Usable { spell: id }))
        }

        // Not a known path - assume it's a user variable
        _ => Ok(Expr::UserVar {
            name: s.to_string(),
        }),
    }
}

fn parse_var_op(s: &str) -> Result<VarOp> {
    match s {
        "set" => Ok(VarOp::Set),
        "add" => Ok(VarOp::Add),
        "sub" => Ok(VarOp::Sub),
        "mul" => Ok(VarOp::Mul),
        "div" => Ok(VarOp::Div),
        "min" => Ok(VarOp::Min),
        "max" => Ok(VarOp::Max),
        "reset" => Ok(VarOp::Reset),
        _ => Err(Error::UnknownOperator(s.to_string())),
    }
}

fn require_array<'a>(value: &'a Value, op: &str) -> Result<&'a Vec<Value>> {
    value
        .as_array()
        .ok_or_else(|| Error::Syntax(format!("{} requires array", op)))
}

fn require_binary<'a>(value: &'a Value, op: &'static str) -> Result<(&'a Value, &'a Value)> {
    let arr = require_array(value, op)?;
    if arr.len() != 2 {
        return Err(Error::ArgCount {
            op,
            expected: 2,
            got: arr.len(),
        });
    }
    Ok((&arr[0], &arr[1]))
}
