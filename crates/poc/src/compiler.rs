//! # Compiler
//!
//! Compiles rotation scripts and manages AST optimization.

use crate::action::{self, encoding, Action};
use crate::preprocess::{self, NamespaceConfig};
use crate::schema::{GameState, StateSchema};
use rhai::{ASTNode, Dynamic, Engine, Expr, OptimizationLevel, AST};

/// Rotation script compiler using AST optimization caching.
///
/// ## Workflow
///
/// 1. `compile()` - Parse script, extract schema
/// 2. `optimize()` - Re-optimize AST when state changes (~8 μs)
/// 3. `evaluate_optimized()` - Walk cached AST for action (~0.07 μs)
pub struct RotationCompiler {
    engine: Engine,
    base_ast: AST,
    schema: StateSchema,
}

impl RotationCompiler {
    /// Compile with default namespace config.
    pub fn compile(script: &str) -> Result<Self, Box<rhai::EvalAltResult>> {
        Self::compile_with(script, &NamespaceConfig::default())
    }

    /// Compile with custom namespace config.
    pub fn compile_with(
        script: &str,
        config: &NamespaceConfig,
    ) -> Result<Self, Box<rhai::EvalAltResult>> {
        let transformed = preprocess::transform(script, config);
        let mut engine = create_engine();

        // Compile with optimization OFF to preserve AST structure
        engine.set_optimization_level(OptimizationLevel::None);
        let base_ast = engine.compile(&transformed)?;

        // Extract schema from AST
        let schema = extract_schema(&base_ast);

        Ok(Self {
            engine,
            base_ast,
            schema,
        })
    }

    pub fn schema(&self) -> &StateSchema {
        &self.schema
    }

    pub fn new_state(&self) -> GameState {
        GameState::new(&self.schema)
    }

    pub fn engine(&self) -> &Engine {
        &self.engine
    }

    pub fn base_ast(&self) -> &AST {
        &self.base_ast
    }

    /// Optimize AST with current state (~8 μs).
    pub fn optimize(&self, state: &GameState) -> AST {
        let scope = state.to_scope(&self.schema);
        self.engine
            .optimize_ast(&scope, self.base_ast.clone(), OptimizationLevel::Full)
    }

    /// Extract action from optimized AST (~0.07 μs).
    pub fn evaluate_optimized(&self, optimized: &AST) -> Action {
        action::extract(optimized)
    }

    /// Full evaluation: optimize + extract.
    pub fn evaluate(&self, state: &GameState) -> Action {
        action::extract(&self.optimize(state))
    }

    /// Create partial AST with static state baked in.
    ///
    /// Use for two-pass optimization:
    /// 1. Bake in static state (talents, config) once
    /// 2. Optimize from partial with dynamic state at runtime
    pub fn optimize_partial(&self, static_state: &GameState) -> AST {
        let scope = static_state.to_scope(&self.schema);
        self.engine
            .optimize_ast(&scope, self.base_ast.clone(), OptimizationLevel::Full)
    }

    /// Optimize from a partial AST.
    pub fn optimize_from_partial(&self, partial: &AST, state: &GameState) -> AST {
        let scope = state.to_scope(&self.schema);
        self.engine
            .optimize_ast(&scope, partial.clone(), OptimizationLevel::Full)
    }
}

/// Create engine with action functions registered.
fn create_engine() -> Engine {
    let mut engine = Engine::new();

    engine.register_fn("cast", |spell: &str| {
        Dynamic::from(format!("{}{}", encoding::CAST, spell))
    });
    engine.register_fn("wait", |secs: f64| {
        Dynamic::from(format!("{}{}", encoding::WAIT, secs))
    });
    engine.register_fn("wait_gcd", || Dynamic::from(encoding::WAIT_GCD.to_string()));

    engine
}

/// Extract all variable names from AST into a schema.
fn extract_schema(ast: &AST) -> StateSchema {
    let mut schema = StateSchema::new();
    ast.walk(&mut |nodes: &[ASTNode]| {
        if let Some(ASTNode::Expr(Expr::Variable(var, _, _))) = nodes.last() {
            schema.register(var.1.as_str());
        }
        true
    });
    schema
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn basic_rotation() {
        let script = "if ready { cast(\"spell\") } else { wait_gcd() }";
        let compiler = RotationCompiler::compile(script).unwrap();
        let mut state = compiler.new_state();
        let slot = compiler.schema().slot("ready").unwrap();

        state.set_bool(slot, true);
        assert_eq!(compiler.evaluate(&state), Action::Cast("spell".into()));

        state.set_bool(slot, false);
        assert_eq!(compiler.evaluate(&state), Action::WaitGcd);
    }

    #[test]
    fn namespace_api() {
        let script = r#"
            if $talent.killer.enabled && $target.health < 0.2 {
                cast($spell.execute)
            } else {
                cast($spell.filler)
            }
        "#;

        let compiler = RotationCompiler::compile(script).unwrap();
        let mut state = compiler.new_state();

        let talent = compiler.schema().slot("talent_killer_enabled").unwrap();
        let health = compiler.schema().slot("target_health").unwrap();

        state.set_bool(talent, true);
        state.set_float(health, 0.1);
        assert_eq!(compiler.evaluate(&state), Action::Cast("execute".into()));

        state.set_float(health, 0.8);
        assert_eq!(compiler.evaluate(&state), Action::Cast("filler".into()));
    }

    #[test]
    fn cached_evaluation() {
        let script = "if x { cast(\"a\") } else { cast(\"b\") }";
        let compiler = RotationCompiler::compile(script).unwrap();
        let mut state = compiler.new_state();
        state.set_bool(compiler.schema().slot("x").unwrap(), true);

        let optimized = compiler.optimize(&state);
        for _ in 0..100 {
            assert_eq!(
                compiler.evaluate_optimized(&optimized),
                Action::Cast("a".into())
            );
        }
    }
}
