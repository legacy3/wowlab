//! Plain Rhai evaluator for benchmarking comparison.
//!
//! This evaluator uses standard Rhai evaluation without AST optimization caching.
//! It serves as a baseline for performance comparisons against the optimized
//! [`RotationCompiler`](crate::RotationCompiler).

use crate::preprocess::{self, NamespaceConfig};
use crate::schema::{GameState, StateSchema};
use rhai::{ASTNode, Dynamic, Engine, Expr, OptimizationLevel, AST};

/// Plain Rhai evaluator without AST optimization caching.
///
/// This is primarily used for benchmarking to compare against the optimized
/// [`RotationCompiler`](crate::RotationCompiler). It evaluates scripts using
/// standard Rhai evaluation rather than pre-optimized AST walking.
pub struct PlainEvaluator {
    engine: Engine,
    ast: AST,
    schema: StateSchema,
}

impl PlainEvaluator {
    /// Compiles a rotation script with the default namespace configuration.
    ///
    /// # Errors
    ///
    /// Returns an error if the script fails to parse.
    pub fn compile(script: &str) -> Result<Self, Box<rhai::EvalAltResult>> {
        Self::compile_with(script, &NamespaceConfig::default())
    }

    /// Compiles a rotation script with a custom namespace configuration.
    ///
    /// # Errors
    ///
    /// Returns an error if the script fails to parse.
    pub fn compile_with(
        script: &str,
        config: &NamespaceConfig,
    ) -> Result<Self, Box<rhai::EvalAltResult>> {
        let result = preprocess::transform(script, config);

        let mut engine = Engine::new();
        engine.register_fn("cast", |spell: &str| {
            Dynamic::from(format!("Cast(\"{spell}\")"))
        });
        engine.register_fn("wait", |secs: f64| Dynamic::from(format!("Wait({secs})")));
        engine.register_fn("wait_gcd", || Dynamic::from("WaitGcd".to_string()));

        // Compile optimized AST
        engine.set_optimization_level(OptimizationLevel::Full);
        let ast = engine.compile(&result.script)?;

        // Extract schema from unoptimized version to capture all variables
        engine.set_optimization_level(OptimizationLevel::None);
        let unopt = engine.compile(&result.script)?;
        let mut schema = extract_schema(&unopt);

        // Register method call variables
        for call in &result.method_calls {
            schema.register(&call.var);
        }
        schema.set_method_calls(result.method_calls);

        Ok(Self { engine, ast, schema })
    }

    /// Evaluates the script with the given state, returning the result as a string.
    #[must_use]
    pub fn evaluate(&self, state: &GameState) -> String {
        let mut scope = state.to_scope(&self.schema);
        self.engine
            .eval_ast_with_scope::<Dynamic>(&mut scope, &self.ast)
            .map_or_else(|e| format!("Error: {e}"), |d| d.to_string())
    }

    /// Returns the schema for this compiled evaluator.
    #[must_use]
    pub fn schema(&self) -> &StateSchema {
        &self.schema
    }

    /// Creates a new state instance for this evaluator.
    #[must_use]
    pub fn new_state(&self) -> GameState {
        GameState::new(&self.schema)
    }
}

/// Extracts all variable names from an AST into a schema.
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
