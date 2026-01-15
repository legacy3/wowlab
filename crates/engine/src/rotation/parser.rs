//! JSON parser for rotation definitions.

use std::collections::HashMap;

use serde_json::Value;

use super::ast::{Action, Expr, Rotation, VarOp, VarPath};
use super::error::{Error, Result};

impl Rotation {
    /// Parse a rotation from JSON string.
    pub fn from_json(json: &str) -> Result<Self> {
        let value: Value = serde_json::from_str(json)?;
        Self::from_value(&value)
    }

    /// Parse from a JSON value.
    pub fn from_value(value: &Value) -> Result<Self> {
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
                variables.insert(k.clone(), parse_expr(v)?);
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
                    actions.push(parse_action(item)?);
                }
                lists.insert(k.clone(), actions);
            }
        }

        // Parse actions
        let mut actions = Vec::new();
        if let Some(arr) = obj.get("actions").and_then(|v| v.as_array()) {
            for item in arr {
                actions.push(parse_action(item)?);
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

fn parse_action(value: &Value) -> Result<Action> {
    let obj = value
        .as_object()
        .ok_or_else(|| Error::Syntax("action must be an object".into()))?;

    let condition = obj.get("if").map(parse_expr).transpose()?;

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
            value: parse_expr(value)?,
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
            value: parse_expr(value)?,
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
            condition: parse_expr(cond)?,
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

fn parse_expr(value: &Value) -> Result<Expr> {
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
        Value::String(s) => parse_var_or_user_var(s),

        Value::Object(obj) => {
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
                    let operands: Result<Vec<_>> = arr.iter().map(parse_expr).collect();
                    Ok(Expr::And { operands: operands? })
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
                    let operands: Result<Vec<_>> = arr.iter().map(parse_expr).collect();
                    Ok(Expr::Or { operands: operands? })
                }

                "not" => {
                    let inner = if args.is_array() {
                        &args.as_array().unwrap()[0]
                    } else {
                        args
                    };
                    Ok(Expr::Not { operand: Box::new(parse_expr(inner)?) })
                }

                // Comparison
                ">" => {
                    let (a, b) = require_binary(args, ">")?;
                    Ok(Expr::Gt { left: Box::new(parse_expr(a)?), right: Box::new(parse_expr(b)?) })
                }
                ">=" => {
                    let (a, b) = require_binary(args, ">=")?;
                    Ok(Expr::Gte { left: Box::new(parse_expr(a)?), right: Box::new(parse_expr(b)?) })
                }
                "<" => {
                    let (a, b) = require_binary(args, "<")?;
                    Ok(Expr::Lt { left: Box::new(parse_expr(a)?), right: Box::new(parse_expr(b)?) })
                }
                "<=" => {
                    let (a, b) = require_binary(args, "<=")?;
                    Ok(Expr::Lte { left: Box::new(parse_expr(a)?), right: Box::new(parse_expr(b)?) })
                }
                "==" => {
                    let (a, b) = require_binary(args, "==")?;
                    Ok(Expr::Eq { left: Box::new(parse_expr(a)?), right: Box::new(parse_expr(b)?) })
                }
                "!=" => {
                    let (a, b) = require_binary(args, "!=")?;
                    Ok(Expr::Ne { left: Box::new(parse_expr(a)?), right: Box::new(parse_expr(b)?) })
                }

                // Arithmetic
                "+" => {
                    let (a, b) = require_binary(args, "+")?;
                    Ok(Expr::Add { left: Box::new(parse_expr(a)?), right: Box::new(parse_expr(b)?) })
                }
                "-" => {
                    let (a, b) = require_binary(args, "-")?;
                    Ok(Expr::Sub { left: Box::new(parse_expr(a)?), right: Box::new(parse_expr(b)?) })
                }
                "*" => {
                    let (a, b) = require_binary(args, "*")?;
                    Ok(Expr::Mul { left: Box::new(parse_expr(a)?), right: Box::new(parse_expr(b)?) })
                }
                "/" => {
                    let (a, b) = require_binary(args, "/")?;
                    Ok(Expr::Div { left: Box::new(parse_expr(a)?), right: Box::new(parse_expr(b)?) })
                }
                "%" => {
                    let (a, b) = require_binary(args, "%")?;
                    Ok(Expr::Mod { left: Box::new(parse_expr(a)?), right: Box::new(parse_expr(b)?) })
                }

                // Functions
                "floor" => Ok(Expr::Floor { operand: Box::new(parse_expr(args)?) }),
                "ceil" => Ok(Expr::Ceil { operand: Box::new(parse_expr(args)?) }),
                "abs" => Ok(Expr::Abs { operand: Box::new(parse_expr(args)?) }),
                "min" => {
                    let (a, b) = require_binary(args, "min")?;
                    Ok(Expr::Min { left: Box::new(parse_expr(a)?), right: Box::new(parse_expr(b)?) })
                }
                "max" => {
                    let (a, b) = require_binary(args, "max")?;
                    Ok(Expr::Max { left: Box::new(parse_expr(a)?), right: Box::new(parse_expr(b)?) })
                }

                _ => Err(Error::UnknownOperator(op.clone())),
            }
        }

        _ => Err(Error::Syntax(format!("unexpected value: {:?}", value))),
    }
}

fn parse_var_or_user_var(s: &str) -> Result<Expr> {
    // Try to parse as a variable path
    match parse_var_path(s) {
        Ok(path) => Ok(Expr::Var { path }),
        Err(_) => {
            // Assume it's a user variable
            Ok(Expr::UserVar { name: s.to_string() })
        }
    }
}

fn parse_var_path(s: &str) -> Result<VarPath> {
    let parts: Vec<&str> = s.split('.').collect();

    match parts.as_slice() {
        // resource.*
        ["resource", name] => Ok(VarPath::Resource { resource: name.to_string() }),
        ["resource", name, "max"] => Ok(VarPath::ResourceMax { resource: name.to_string() }),
        ["resource", name, "deficit"] => Ok(VarPath::ResourceDeficit { resource: name.to_string() }),
        ["resource", name, "percent"] => Ok(VarPath::ResourcePercent { resource: name.to_string() }),
        ["resource", name, "regen"] => Ok(VarPath::ResourceRegen { resource: name.to_string() }),

        // player.*
        ["player", "health"] => Ok(VarPath::PlayerHealth),
        ["player", "health", "max"] => Ok(VarPath::PlayerHealthMax),
        ["player", "health", "percent"] => Ok(VarPath::PlayerHealthPercent),

        // cd.*
        ["cd", spell, "ready"] => Ok(VarPath::CdReady { spell: spell.to_string() }),
        ["cd", spell, "remaining"] => Ok(VarPath::CdRemaining { spell: spell.to_string() }),
        ["cd", spell, "duration"] => Ok(VarPath::CdDuration { spell: spell.to_string() }),
        ["cd", spell, "charges"] => Ok(VarPath::CdCharges { spell: spell.to_string() }),
        ["cd", spell, "charges_max"] => Ok(VarPath::CdChargesMax { spell: spell.to_string() }),
        ["cd", spell, "recharge_time"] => Ok(VarPath::CdRechargeTime { spell: spell.to_string() }),
        ["cd", spell, "full_recharge"] => Ok(VarPath::CdFullRecharge { spell: spell.to_string() }),

        // buff.*
        ["buff", name, "active"] => Ok(VarPath::BuffActive { aura: name.to_string() }),
        ["buff", name, "inactive"] => Ok(VarPath::BuffInactive { aura: name.to_string() }),
        ["buff", name, "remaining"] => Ok(VarPath::BuffRemaining { aura: name.to_string() }),
        ["buff", name, "stacks"] => Ok(VarPath::BuffStacks { aura: name.to_string() }),
        ["buff", name, "stacks_max"] => Ok(VarPath::BuffStacksMax { aura: name.to_string() }),
        ["buff", name, "duration"] => Ok(VarPath::BuffDuration { aura: name.to_string() }),

        // debuff.*
        ["debuff", name, "active"] => Ok(VarPath::DebuffActive { aura: name.to_string() }),
        ["debuff", name, "inactive"] => Ok(VarPath::DebuffInactive { aura: name.to_string() }),
        ["debuff", name, "remaining"] => Ok(VarPath::DebuffRemaining { aura: name.to_string() }),
        ["debuff", name, "stacks"] => Ok(VarPath::DebuffStacks { aura: name.to_string() }),
        ["debuff", name, "refreshable"] => Ok(VarPath::DebuffRefreshable { aura: name.to_string() }),

        // dot.*
        ["dot", name, "ticking"] => Ok(VarPath::DotTicking { dot: name.to_string() }),
        ["dot", name, "remaining"] => Ok(VarPath::DotRemaining { dot: name.to_string() }),
        ["dot", name, "refreshable"] => Ok(VarPath::DotRefreshable { dot: name.to_string() }),
        ["dot", name, "ticks_remaining"] => Ok(VarPath::DotTicksRemaining { dot: name.to_string() }),

        // target.*
        ["target", "health_percent"] => Ok(VarPath::TargetHealthPercent),
        ["target", "time_to_die"] => Ok(VarPath::TargetTimeToDie),
        ["target", "distance"] => Ok(VarPath::TargetDistance),

        // enemy.*
        ["enemy", "count"] => Ok(VarPath::EnemyCount),

        // combat.*
        ["combat", "time"] => Ok(VarPath::CombatTime),
        ["combat", "remaining"] => Ok(VarPath::CombatRemaining),

        // gcd.*
        ["gcd", "remaining"] => Ok(VarPath::GcdRemaining),
        ["gcd", "duration"] => Ok(VarPath::GcdDuration),

        // pet.*
        ["pet", "active"] => Ok(VarPath::PetActive),
        ["pet", "remaining"] => Ok(VarPath::PetRemaining),
        ["pet", "buff", name, "active"] => Ok(VarPath::PetBuffActive { aura: name.to_string() }),

        // talent.*
        ["talent", name] => Ok(VarPath::Talent { name: name.to_string() }),

        // equipped.*
        ["equipped", name] => Ok(VarPath::Equipped { item: name.to_string() }),

        // trinket.*
        ["trinket", slot, "ready"] => {
            let slot: u8 = slot
                .parse()
                .map_err(|_| Error::Syntax(format!("invalid trinket slot: {}", slot)))?;
            Ok(VarPath::TrinketReady { slot })
        }
        ["trinket", slot, "remaining"] => {
            let slot: u8 = slot
                .parse()
                .map_err(|_| Error::Syntax(format!("invalid trinket slot: {}", slot)))?;
            Ok(VarPath::TrinketRemaining { slot })
        }

        // spell.*
        ["spell", name, "cost"] => Ok(VarPath::SpellCost { spell: name.to_string() }),
        ["spell", name, "cast_time"] => Ok(VarPath::SpellCastTime { spell: name.to_string() }),

        _ => Err(Error::UnknownPath(s.to_string())),
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
