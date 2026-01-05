//! Rotation script compiler with AST optimization.
//!
//! Compiles rotation scripts and manages AST optimization for
//! high-performance evaluation.
//!
//! # Method Call Extraction
//!
//! Since scripts are pure (no `$state` mutation), method calls return the same
//! value throughout one tick. We extract them during preprocessing:
//!
//! ```text
//! $spell.bar.ready()  ->  __m0  (extracted, evaluated once per tick)
//! ```
//!
//! At runtime: evaluate extracted calls, inject as constants, optimize AST.

use crate::rotation::action::{self, encoding, Action};
use crate::rotation::preprocess::{self, NamespaceConfig};
use crate::rotation::schema::{GameState, StateSchema};
use rhai::{ASTNode, Dynamic, Engine, Expr, OptimizationLevel, AST};

/// Rotation script compiler using AST optimization caching.
///
/// # Workflow
///
/// 1. [`compile()`](Self::compile) - Parse script, extract schema and method calls
/// 2. [`optimize()`](Self::optimize) - Re-optimize AST when state changes (~8 us)
/// 3. [`evaluate_optimized()`](Self::evaluate_optimized) - Walk cached AST for action (~0.07 us)
///
/// # Method Call Handling
///
/// Method calls like `$spell.bar.ready()` are extracted during preprocessing.
/// Use [`schema().method_calls()`](StateSchema::method_calls) to get them,
/// evaluate each once per tick, then inject results into [`GameState`] before
/// calling [`optimize()`](Self::optimize).
pub struct RotationCompiler {
    engine: Engine,
    base_ast: AST,
    schema: StateSchema,
}

impl RotationCompiler {
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
        let mut engine = create_engine();

        // Compile with optimization OFF to preserve AST structure
        engine.set_optimization_level(OptimizationLevel::None);
        let base_ast = engine.compile(&result.script)?;

        // Extract schema from AST and store method calls
        let mut schema = extract_schema(&base_ast);

        // Register method call variables in schema
        for call in &result.method_calls {
            schema.register(&call.var);
        }
        schema.set_method_calls(result.method_calls);

        Ok(Self {
            engine,
            base_ast,
            schema,
        })
    }

    /// Returns the schema for this compiled rotation.
    #[must_use]
    pub fn schema(&self) -> &StateSchema {
        &self.schema
    }

    /// Creates a new state instance for this rotation.
    #[must_use]
    pub fn new_state(&self) -> GameState {
        GameState::new(&self.schema)
    }

    /// Returns a reference to the Rhai engine.
    #[must_use]
    pub fn engine(&self) -> &Engine {
        &self.engine
    }

    /// Returns a reference to the base (unoptimized) AST.
    #[must_use]
    pub fn base_ast(&self) -> &AST {
        &self.base_ast
    }

    /// Optimizes the AST with the current state values (~8 us).
    ///
    /// The optimizer performs constant folding and dead code elimination
    /// based on the injected state values.
    #[must_use]
    pub fn optimize(&self, state: &GameState) -> AST {
        let scope = state.to_scope(&self.schema);
        self.engine
            .optimize_ast(&scope, self.base_ast.clone(), OptimizationLevel::Full)
    }

    /// Extracts the action from an optimized AST (~0.07 us).
    ///
    /// The optimized AST should be reduced to a single action string.
    #[must_use]
    pub fn evaluate_optimized(&self, optimized: &AST) -> Action {
        action::extract(optimized)
    }

    /// Performs full evaluation: optimize and then extract.
    ///
    /// This is a convenience method that combines [`optimize()`](Self::optimize)
    /// and [`evaluate_optimized()`](Self::evaluate_optimized).
    #[must_use]
    pub fn evaluate(&self, state: &GameState) -> Action {
        action::extract(&self.optimize(state))
    }

    /// Creates a partial AST with static state baked in.
    ///
    /// Use for two-pass optimization:
    /// 1. Bake in static state (talents, config) once
    /// 2. Optimize from partial with dynamic state at runtime
    #[must_use]
    pub fn optimize_partial(&self, static_state: &GameState) -> AST {
        let scope = static_state.to_scope(&self.schema);
        self.engine
            .optimize_ast(&scope, self.base_ast.clone(), OptimizationLevel::Full)
    }

    /// Optimizes from a partial AST with additional state values.
    ///
    /// Use with [`optimize_partial()`](Self::optimize_partial) for two-pass optimization.
    #[must_use]
    pub fn optimize_from_partial(&self, partial: &AST, state: &GameState) -> AST {
        let scope = state.to_scope(&self.schema);
        self.engine
            .optimize_ast(&scope, partial.clone(), OptimizationLevel::Full)
    }
}

/// Creates a Rhai engine with action functions registered.
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
