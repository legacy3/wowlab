//! JsonLogic parser for rotation conditions.

use serde::Deserialize;
use serde_json::Value;

use super::ast::{Condition, Operand, Rotation, RotationAction, VarId};
use super::error::{Error, Result};

/// JSON format for a rotation.
#[derive(Debug, Deserialize)]
pub struct RotationJson {
    pub name: String,
    pub actions: Vec<ActionJson>,
}

/// JSON format for an action.
#[derive(Debug, Deserialize)]
pub struct ActionJson {
    pub spell_id: u32,
    #[serde(default)]
    pub condition: Option<Value>,
}

impl Rotation {
    /// Parse a rotation from JSON string.
    pub fn from_json(json: &str) -> Result<Self> {
        let parsed: RotationJson = serde_json::from_str(json)?;
        Self::from_json_value(parsed)
    }

    /// Parse from already-parsed JSON.
    pub fn from_json_value(json: RotationJson) -> Result<Self> {
        let mut actions = Vec::with_capacity(json.actions.len());

        for action_json in json.actions {
            let condition = match action_json.condition {
                Some(ref v) if !v.is_null() => Some(Condition::from_jsonlogic(v)?),
                _ => None,
            };

            actions.push(RotationAction {
                spell_id: action_json.spell_id,
                condition,
            });
        }

        Ok(Rotation {
            name: json.name,
            actions,
        })
    }
}

impl Condition {
    /// Parse a JsonLogic condition.
    pub fn from_jsonlogic(value: &Value) -> Result<Self> {
        match value {
            Value::Bool(b) => Ok(Condition::Literal(*b)),

            Value::String(s) => {
                let var_id = VarId::from_path(s)?;
                if var_id.is_bool() {
                    Ok(Condition::Var(var_id))
                } else {
                    Err(Error::TypeMismatch {
                        expected: "bool",
                        got: "number",
                    })
                }
            }

            Value::Object(obj) => {
                if obj.len() != 1 {
                    return Err(Error::InvalidJsonLogic(format!(
                        "expected single operator, got {} keys",
                        obj.len()
                    )));
                }

                let (op, args) = obj.iter().next().unwrap();

                match op.as_str() {
                    "and" => {
                        let arr = args
                            .as_array()
                            .ok_or_else(|| Error::InvalidJsonLogic("and requires array".into()))?;
                        if arr.len() < 2 {
                            return Err(Error::InvalidJsonLogic("and requires 2+ args".into()));
                        }
                        let mut result = Condition::from_jsonlogic(&arr[0])?;
                        for item in &arr[1..] {
                            result = Condition::And(
                                Box::new(result),
                                Box::new(Self::from_jsonlogic(item)?),
                            );
                        }
                        Ok(result)
                    }

                    "or" => {
                        let arr = args
                            .as_array()
                            .ok_or_else(|| Error::InvalidJsonLogic("or requires array".into()))?;
                        if arr.len() < 2 {
                            return Err(Error::InvalidJsonLogic("or requires 2+ args".into()));
                        }
                        let mut result = Condition::from_jsonlogic(&arr[0])?;
                        for item in &arr[1..] {
                            result = Condition::Or(
                                Box::new(result),
                                Box::new(Self::from_jsonlogic(item)?),
                            );
                        }
                        Ok(result)
                    }

                    "!" | "not" => {
                        let inner = if args.is_array() {
                            &args.as_array().unwrap()[0]
                        } else {
                            args
                        };
                        Ok(Condition::Not(Box::new(Self::from_jsonlogic(inner)?)))
                    }

                    ">=" | "gte" => {
                        let (a, b) = parse_binary_args(args)?;
                        Ok(Condition::Gte(
                            Operand::from_jsonlogic(&a)?,
                            Operand::from_jsonlogic(&b)?,
                        ))
                    }

                    ">" | "gt" => {
                        let (a, b) = parse_binary_args(args)?;
                        Ok(Condition::Gt(
                            Operand::from_jsonlogic(&a)?,
                            Operand::from_jsonlogic(&b)?,
                        ))
                    }

                    "<=" | "lte" => {
                        let (a, b) = parse_binary_args(args)?;
                        Ok(Condition::Lte(
                            Operand::from_jsonlogic(&a)?,
                            Operand::from_jsonlogic(&b)?,
                        ))
                    }

                    "<" | "lt" => {
                        let (a, b) = parse_binary_args(args)?;
                        Ok(Condition::Lt(
                            Operand::from_jsonlogic(&a)?,
                            Operand::from_jsonlogic(&b)?,
                        ))
                    }

                    "==" | "eq" => {
                        let (a, b) = parse_binary_args(args)?;
                        Ok(Condition::Eq(
                            Operand::from_jsonlogic(&a)?,
                            Operand::from_jsonlogic(&b)?,
                        ))
                    }

                    "!=" | "ne" => {
                        let (a, b) = parse_binary_args(args)?;
                        Ok(Condition::Ne(
                            Operand::from_jsonlogic(&a)?,
                            Operand::from_jsonlogic(&b)?,
                        ))
                    }

                    "var" => {
                        let path = args
                            .as_str()
                            .ok_or_else(|| Error::InvalidJsonLogic("var requires string".into()))?;
                        let var_id = VarId::from_path(path)?;
                        if var_id.is_bool() {
                            Ok(Condition::Var(var_id))
                        } else {
                            Err(Error::TypeMismatch {
                                expected: "bool",
                                got: "number",
                            })
                        }
                    }

                    _ => Err(Error::UnknownOperator(op.clone())),
                }
            }

            _ => Err(Error::InvalidJsonLogic(format!(
                "unexpected value type: {:?}",
                value
            ))),
        }
    }
}

impl Operand {
    /// Parse a JsonLogic operand.
    pub fn from_jsonlogic(value: &Value) -> Result<Self> {
        match value {
            Value::Number(n) => {
                if let Some(i) = n.as_i64() {
                    if i >= i32::MIN as i64 && i <= i32::MAX as i64 {
                        Ok(Operand::Int(i as i32))
                    } else {
                        Ok(Operand::Float(i as f64))
                    }
                } else if let Some(f) = n.as_f64() {
                    Ok(Operand::Float(f))
                } else {
                    Err(Error::InvalidJsonLogic("invalid number".into()))
                }
            }

            Value::Object(obj) if obj.contains_key("var") => {
                let path = obj["var"]
                    .as_str()
                    .ok_or_else(|| Error::InvalidJsonLogic("var requires string".into()))?;
                let var_id = VarId::from_path(path)?;
                Ok(Operand::Var(var_id))
            }

            Value::String(s) => {
                let var_id = VarId::from_path(s)?;
                Ok(Operand::Var(var_id))
            }

            _ => Err(Error::InvalidJsonLogic(format!(
                "invalid operand: {:?}",
                value
            ))),
        }
    }
}

impl VarId {
    /// Parse a variable path like "focus" or "cooldown.0.ready".
    pub fn from_path(path: &str) -> Result<Self> {
        let parts: Vec<&str> = path.split('.').collect();

        match parts.as_slice() {
            ["focus"] => Ok(VarId::Focus),
            ["focus", "max"] => Ok(VarId::FocusMax),
            ["focus", "deficit"] => Ok(VarId::FocusDeficit),

            ["time"] => Ok(VarId::Time),
            ["gcd", "remains"] => Ok(VarId::GcdRemains),

            ["target", "health_pct"] | ["target", "health", "pct"] => Ok(VarId::TargetHealthPct),
            ["target", "time_to_die"] | ["target", "ttd"] => Ok(VarId::TargetTimeToDie),
            ["target", "count"] => Ok(VarId::TargetCount),

            // Cooldowns use slot index: cooldown.0.ready, cooldown.1.remains
            ["cooldown", slot, "ready"] => {
                let slot: u8 = slot.parse().map_err(|_| {
                    Error::InvalidJsonLogic(format!("invalid cooldown slot: {}", slot))
                })?;
                Ok(VarId::CooldownReady(slot))
            }
            ["cooldown", slot, "remains"] => {
                let slot: u8 = slot.parse().map_err(|_| {
                    Error::InvalidJsonLogic(format!("invalid cooldown slot: {}", slot))
                })?;
                Ok(VarId::CooldownRemains(slot))
            }
            ["cooldown", slot, "charges"] => {
                let slot: u8 = slot.parse().map_err(|_| {
                    Error::InvalidJsonLogic(format!("invalid cooldown slot: {}", slot))
                })?;
                Ok(VarId::CooldownCharges(slot))
            }

            // Buffs use slot index: buff.0.active, buff.1.stacks
            ["buff", slot, "active"] | ["buff", slot, "up"] => {
                let slot: u8 = slot.parse().map_err(|_| {
                    Error::InvalidJsonLogic(format!("invalid buff slot: {}", slot))
                })?;
                Ok(VarId::BuffActive(slot))
            }
            ["buff", slot, "stacks"] => {
                let slot: u8 = slot.parse().map_err(|_| {
                    Error::InvalidJsonLogic(format!("invalid buff slot: {}", slot))
                })?;
                Ok(VarId::BuffStacks(slot))
            }
            ["buff", slot, "remains"] => {
                let slot: u8 = slot.parse().map_err(|_| {
                    Error::InvalidJsonLogic(format!("invalid buff slot: {}", slot))
                })?;
                Ok(VarId::BuffRemains(slot))
            }

            // Debuffs
            ["debuff", slot, "active"] | ["debuff", slot, "up"] => {
                let slot: u8 = slot.parse().map_err(|_| {
                    Error::InvalidJsonLogic(format!("invalid debuff slot: {}", slot))
                })?;
                Ok(VarId::DebuffActive(slot))
            }
            ["debuff", slot, "stacks"] => {
                let slot: u8 = slot.parse().map_err(|_| {
                    Error::InvalidJsonLogic(format!("invalid debuff slot: {}", slot))
                })?;
                Ok(VarId::DebuffStacks(slot))
            }
            ["debuff", slot, "remains"] => {
                let slot: u8 = slot.parse().map_err(|_| {
                    Error::InvalidJsonLogic(format!("invalid debuff slot: {}", slot))
                })?;
                Ok(VarId::DebuffRemains(slot))
            }

            ["pet", "active"] => Ok(VarId::PetActive),

            _ => Err(Error::UnknownVariable(path.to_string())),
        }
    }
}

fn parse_binary_args(args: &Value) -> Result<(Value, Value)> {
    let arr = args
        .as_array()
        .ok_or_else(|| Error::InvalidJsonLogic("binary op requires array".into()))?;
    if arr.len() != 2 {
        return Err(Error::InvalidJsonLogic(format!(
            "binary op requires 2 args, got {}",
            arr.len()
        )));
    }
    Ok((arr[0].clone(), arr[1].clone()))
}
