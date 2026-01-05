//! # Plain Evaluator
//!
//! Standard Rhai evaluation without AST caching (for benchmarking comparison).

use crate::preprocess::{self, NamespaceConfig};
use crate::schema::{GameState, StateSchema};
use rhai::{ASTNode, Dynamic, Engine, Expr, OptimizationLevel, AST};

/// Plain Rhai evaluator without AST optimization caching.
pub struct PlainEvaluator {
    engine: Engine,
    ast: AST,
    schema: StateSchema,
}

impl PlainEvaluator {
    pub fn compile(script: &str) -> Result<Self, Box<rhai::EvalAltResult>> {
        Self::compile_with(script, &NamespaceConfig::default())
    }

    pub fn compile_with(
        script: &str,
        config: &NamespaceConfig,
    ) -> Result<Self, Box<rhai::EvalAltResult>> {
        let transformed = preprocess::transform(script, config);

        let mut engine = Engine::new();
        engine.register_fn("cast", |spell: &str| {
            Dynamic::from(format!("Cast(\"{spell}\")"))
        });
        engine.register_fn("wait", |secs: f64| Dynamic::from(format!("Wait({secs})")));
        engine.register_fn("wait_gcd", || Dynamic::from("WaitGcd".to_string()));

        // Compile optimized AST
        engine.set_optimization_level(OptimizationLevel::Full);
        let ast = engine.compile(&transformed)?;

        // Extract schema from unoptimized version
        engine.set_optimization_level(OptimizationLevel::None);
        let unopt = engine.compile(&transformed)?;
        let schema = extract_schema(&unopt);

        Ok(Self { engine, ast, schema })
    }

    pub fn evaluate(&self, state: &GameState) -> String {
        let mut scope = state.to_scope(&self.schema);
        self.engine
            .eval_ast_with_scope::<Dynamic>(&mut scope, &self.ast)
            .map(|d| d.to_string())
            .unwrap_or_else(|e| format!("Error: {e}"))
    }

    pub fn schema(&self) -> &StateSchema {
        &self.schema
    }

    pub fn new_state(&self) -> GameState {
        GameState::new(&self.schema)
    }
}

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
