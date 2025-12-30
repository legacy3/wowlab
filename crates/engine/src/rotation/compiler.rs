//! Rhai AST compiler for rotation scripts.
//!
//! Parses Rhai scripts and walks the AST to extract:
//! - If statements with cast() calls in the body
//! - Condition expressions for predictive gating

use std::collections::HashMap;

use rhai::{ASTNode, Engine, Expr, Stmt, AST};

use crate::config::SimConfig;

use super::condition::{Condition, Rule};

/// Error during rotation compilation.
#[derive(Debug, thiserror::Error)]
pub enum RotationError {
    #[error("Parse error: {0}")]
    Parse(String),

    #[error("Unknown spell: {0}")]
    UnknownSpell(String),

    #[error("Unknown aura: {0}")]
    UnknownAura(String),

    #[error("Invalid condition: {0}")]
    InvalidCondition(String),

    #[error("No cast() call found in if body")]
    NoCastInBody,
}

/// Compiles Rhai rotation scripts into rules.
pub struct RotationCompiler {
    engine: Engine,
    /// Spell name → index mapping
    spell_map: HashMap<String, u8>,
    /// Aura name → index mapping
    aura_map: HashMap<String, u8>,
}

impl RotationCompiler {
    /// Create a new compiler with mappings from config.
    pub fn new(config: &SimConfig) -> Self {
        let mut engine = Engine::new();

        // Register dummy functions so parsing doesn't fail
        engine.register_fn("cast", |_: &str| {});
        engine.register_fn("ready", |_: &str| true);
        engine.register_fn("active", |_: &str| true);
        engine.register_fn("stacks", |_: &str| 0_i64);
        engine.register_fn("remaining", |_: &str| 0.0_f64);
        engine.register_fn("cooldown", |_: &str| 0.0_f64);
        engine.register_fn("charges", |_: &str| 0_i64);

        // Register global variables/functions
        engine.register_fn("resource", || 0.0_f64);
        engine.register_fn("time", || 0.0_f64);
        engine.register_fn("fight_remains", || 0.0_f64);
        engine.register_fn("target_health_pct", || 100.0_f64);

        let mut spell_map = HashMap::new();
        for (i, spell) in config.spells.iter().enumerate() {
            let name = spell.name.to_lowercase().replace(' ', "_").replace('-', "_");
            spell_map.insert(name, i as u8);
        }

        let mut aura_map = HashMap::new();
        for (i, aura) in config.auras.iter().enumerate() {
            let name = aura.name.to_lowercase().replace(' ', "_").replace('-', "_");
            aura_map.insert(name, i as u8);
        }

        Self {
            engine,
            spell_map,
            aura_map,
        }
    }

    /// Compile a rotation script into rules.
    pub fn compile(&self, script: &str) -> Result<Vec<Rule>, RotationError> {
        let ast = self
            .engine
            .compile(script)
            .map_err(|e| RotationError::Parse(e.to_string()))?;

        let mut rules = Vec::new();
        self.extract_rules(&ast, &mut rules)?;
        Ok(rules)
    }

    /// Walk the AST and extract rules from if statements.
    fn extract_rules(&self, ast: &AST, rules: &mut Vec<Rule>) -> Result<(), RotationError> {
        // Walk all statements in the AST
        // Only process top-level if statements (path length == 1)
        ast.walk(&mut |nodes: &[ASTNode]| -> bool {
            // nodes[0] is the current node, rest is path to root
            // We only want top-level statements (no parent statements)
            if nodes.len() == 1 {
                if let Some(ASTNode::Stmt(stmt)) = nodes.first() {
                    // Check if this is an If statement
                    if let Stmt::If(flow_control, _pos) = stmt {
                        // Try to extract a rule from this if statement
                        if let Ok(Some(rule)) = self.extract_rule_from_if(flow_control) {
                            rules.push(rule);
                        }
                    }
                }
            }
            true // continue walking
        });

        Ok(())
    }

    /// Extract a rule from an If statement's FlowControl.
    fn extract_rule_from_if(
        &self,
        flow: &rhai::FlowControl,
    ) -> Result<Option<Rule>, RotationError> {
        // Get the condition expression
        let condition = self.expr_to_condition(&flow.expr)?;

        // Get the spell from the body (look for cast("spell_name") call)
        let spell_idx = self.extract_cast_from_block(&flow.body)?;

        if let Some(idx) = spell_idx {
            Ok(Some(Rule::new(idx, condition)))
        } else {
            Ok(None)
        }
    }

    /// Extract spell index from cast() call in a statement block.
    fn extract_cast_from_block(&self, block: &rhai::StmtBlock) -> Result<Option<u8>, RotationError> {
        for stmt in block.iter() {
            if let Some(idx) = self.extract_cast_from_stmt(stmt)? {
                return Ok(Some(idx));
            }
        }
        Ok(None)
    }

    /// Extract spell index from cast() call in a statement.
    fn extract_cast_from_stmt(&self, stmt: &Stmt) -> Result<Option<u8>, RotationError> {
        match stmt {
            Stmt::FnCall(fn_call, _) => self.extract_cast_from_fn_call(fn_call),
            Stmt::Expr(expr) => self.extract_cast_from_expr(expr),
            _ => Ok(None),
        }
    }

    /// Extract spell index from a function call expression.
    fn extract_cast_from_fn_call(
        &self,
        fn_call: &rhai::FnCallExpr,
    ) -> Result<Option<u8>, RotationError> {
        if fn_call.name == "cast" && !fn_call.args.is_empty() {
            // Get the spell name from the first argument
            if let Expr::StringConstant(name, _) = &fn_call.args[0] {
                let spell_name = name.to_string().to_lowercase().replace(' ', "_").replace('-', "_");
                let idx = self
                    .spell_map
                    .get(&spell_name)
                    .copied()
                    .ok_or_else(|| RotationError::UnknownSpell(spell_name))?;
                return Ok(Some(idx));
            }
        }
        Ok(None)
    }

    /// Extract spell index from an expression (handles Expr containing FnCall).
    fn extract_cast_from_expr(&self, expr: &Expr) -> Result<Option<u8>, RotationError> {
        match expr {
            Expr::FnCall(fn_call, _) => self.extract_cast_from_fn_call(fn_call),
            _ => Ok(None),
        }
    }

    /// Convert a Rhai expression to a Condition.
    fn expr_to_condition(&self, expr: &Expr) -> Result<Condition, RotationError> {
        match expr {
            // Boolean literals
            Expr::BoolConstant(true, _) => Ok(Condition::Always),
            Expr::BoolConstant(false, _) => Ok(Condition::Not(Box::new(Condition::Always))),

            // Logical AND: expr && expr
            Expr::And(exprs, _) => {
                if exprs.len() >= 2 {
                    let left = self.expr_to_condition(&exprs[0])?;
                    let right = self.expr_to_condition(&exprs[1])?;
                    Ok(Condition::And(Box::new(left), Box::new(right)))
                } else {
                    Err(RotationError::InvalidCondition("And requires 2 operands".into()))
                }
            }

            // Logical OR: expr || expr
            Expr::Or(exprs, _) => {
                if exprs.len() >= 2 {
                    let left = self.expr_to_condition(&exprs[0])?;
                    let right = self.expr_to_condition(&exprs[1])?;
                    Ok(Condition::Or(Box::new(left), Box::new(right)))
                } else {
                    Err(RotationError::InvalidCondition("Or requires 2 operands".into()))
                }
            }

            // Function calls: ready("spell"), active("aura"), !expr, etc.
            Expr::FnCall(fn_call, _) => self.fn_call_to_condition(fn_call),

            // Method calls on dot expressions: spell.ready(), aura.active()
            Expr::MethodCall(fn_call, _) => self.method_call_to_condition(fn_call, None),

            // Dot expressions: spell.ready(), aura.active()
            Expr::Dot(binary, _, _) => self.dot_to_condition(binary),

            _ => Err(RotationError::InvalidCondition(format!(
                "Unsupported expression type: {:?}",
                std::mem::discriminant(expr)
            ))),
        }
    }

    /// Convert a function call to a condition.
    fn fn_call_to_condition(&self, fn_call: &rhai::FnCallExpr) -> Result<Condition, RotationError> {
        let name = fn_call.name.as_str();

        match name {
            // Logical NOT: !expr (Rhai represents ! as a function call)
            "!" if !fn_call.args.is_empty() => {
                let inner = self.expr_to_condition(&fn_call.args[0])?;
                Ok(Condition::Not(Box::new(inner)))
            }
            "ready" if !fn_call.args.is_empty() => {
                let spell_name = self.extract_string_arg(&fn_call.args[0])?;
                let idx = self.resolve_spell(&spell_name)?;
                Ok(Condition::SpellReady(idx))
            }
            "active" if !fn_call.args.is_empty() => {
                let aura_name = self.extract_string_arg(&fn_call.args[0])?;
                let idx = self.resolve_aura(&aura_name)?;
                Ok(Condition::AuraActive(idx))
            }
            "resource" => {
                // resource() >= N is handled by comparison, this is just resource value
                Err(RotationError::InvalidCondition(
                    "resource() must be used in a comparison".into(),
                ))
            }
            "time" => {
                Err(RotationError::InvalidCondition(
                    "time() must be used in a comparison".into(),
                ))
            }
            _ => Err(RotationError::InvalidCondition(format!(
                "Unknown function: {}",
                name
            ))),
        }
    }

    /// Convert a method call to a condition.
    fn method_call_to_condition(
        &self,
        fn_call: &rhai::FnCallExpr,
        target_name: Option<&str>,
    ) -> Result<Condition, RotationError> {
        let method = fn_call.name.as_str();

        // If we have a target name (from dot expression), use it
        // Otherwise try to get it from the first argument
        let target = if let Some(name) = target_name {
            name.to_string()
        } else if !fn_call.args.is_empty() {
            self.extract_string_arg(&fn_call.args[0])?
        } else {
            return Err(RotationError::InvalidCondition(format!(
                "Method {} requires a target",
                method
            )));
        };

        match method {
            "ready" => {
                let idx = self.resolve_spell(&target)?;
                Ok(Condition::SpellReady(idx))
            }
            "active" => {
                let idx = self.resolve_aura(&target)?;
                Ok(Condition::AuraActive(idx))
            }
            "charges" => {
                // This would need to be in a comparison >= N
                Err(RotationError::InvalidCondition(
                    "charges() must be used in a comparison".into(),
                ))
            }
            _ => Err(RotationError::InvalidCondition(format!(
                "Unknown method: {}",
                method
            ))),
        }
    }

    /// Convert a dot expression to a condition.
    fn dot_to_condition(&self, binary: &rhai::BinaryExpr) -> Result<Condition, RotationError> {
        // Left side should be variable (spell/aura name)
        let target_name = self.extract_variable_name(&binary.lhs)?;

        // Right side should be method call or property
        match &binary.rhs {
            Expr::MethodCall(fn_call, _) => {
                self.method_call_to_condition(fn_call, Some(&target_name))
            }
            Expr::FnCall(fn_call, _) => {
                // Function call on dot: spell.ready()
                let method = fn_call.name.as_str();
                match method {
                    "ready" => {
                        let idx = self.resolve_spell(&target_name)?;
                        Ok(Condition::SpellReady(idx))
                    }
                    "active" => {
                        let idx = self.resolve_aura(&target_name)?;
                        Ok(Condition::AuraActive(idx))
                    }
                    _ => Err(RotationError::InvalidCondition(format!(
                        "Unknown method: {}",
                        method
                    ))),
                }
            }
            Expr::Property(prop, _) => {
                // Property access: spell.ready (without parens)
                let (_, _, prop_name) = prop.as_ref();
                match prop_name.as_str() {
                    "ready" => {
                        let idx = self.resolve_spell(&target_name)?;
                        Ok(Condition::SpellReady(idx))
                    }
                    "active" => {
                        let idx = self.resolve_aura(&target_name)?;
                        Ok(Condition::AuraActive(idx))
                    }
                    _ => Err(RotationError::InvalidCondition(format!(
                        "Unknown property: {}",
                        prop_name
                    ))),
                }
            }
            _ => Err(RotationError::InvalidCondition(
                "Expected method call or property on dot expression".into(),
            )),
        }
    }

    /// Extract a string argument from an expression.
    fn extract_string_arg(&self, expr: &Expr) -> Result<String, RotationError> {
        match expr {
            Expr::StringConstant(s, _) => Ok(s.to_string()),
            Expr::Variable(_, _, _) => self.extract_variable_name(expr),
            _ => Err(RotationError::InvalidCondition(
                "Expected string or variable".into(),
            )),
        }
    }

    /// Extract variable name from expression.
    fn extract_variable_name(&self, expr: &Expr) -> Result<String, RotationError> {
        match expr {
            Expr::Variable(var_info, _, _) => {
                // var_info is Box<(Option<NonZeroUsize>, ImmutableString, ...)>
                // Index 1 is the variable name (ImmutableString)
                let name = var_info.1.as_str();
                Ok(name.to_lowercase().replace(' ', "_").replace('-', "_"))
            }
            _ => Err(RotationError::InvalidCondition(
                "Expected variable name".into(),
            )),
        }
    }

    /// Resolve spell name to index.
    fn resolve_spell(&self, name: &str) -> Result<u8, RotationError> {
        let normalized = name.to_lowercase().replace(' ', "_").replace('-', "_");
        self.spell_map
            .get(&normalized)
            .copied()
            .ok_or_else(|| RotationError::UnknownSpell(normalized))
    }

    /// Resolve aura name to index.
    fn resolve_aura(&self, name: &str) -> Result<u8, RotationError> {
        let normalized = name.to_lowercase().replace(' ', "_").replace('-', "_");
        self.aura_map
            .get(&normalized)
            .copied()
            .ok_or_else(|| RotationError::UnknownAura(normalized))
    }
}
