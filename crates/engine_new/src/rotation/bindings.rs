//! Game state bindings for rotation scripts.
//!
//! Provides the trait and implementation for binding simulation state
//! to rotation state variables.

use crate::rotation::schema::{GameState, StateSchema};
use crate::rotation::compiler::RotationCompiler;
use crate::rotation::action::Action;
use crate::sim::SimState;
use rhai::AST;

/// Trait for binding game state to rotation state.
///
/// Implementors provide the mapping from simulation state to the flat
/// variable schema expected by the rotation compiler.
pub trait RotationBindings {
    /// Update rotation state from simulation state.
    ///
    /// Called before optimization to populate state variables.
    fn update_state(&self, state: &mut GameState, schema: &StateSchema, sim: &SimState);

    /// Evaluate extracted method calls.
    ///
    /// Returns a list of (slot_index, result) pairs for each method call
    /// that was extracted from the script.
    fn evaluate_methods(&self, schema: &StateSchema, sim: &SimState) -> Vec<(usize, bool)>;
}

/// Rotation handler combining compiler and bindings.
///
/// This struct ties together:
/// - The compiled rotation script
/// - The bindings implementation that maps sim state to rotation state
/// - Optional cached partial AST for two-pass optimization
///
/// # Usage
///
/// ```ignore
/// let rotation = Rotation::new(script, bindings)?;
///
/// // On talent change
/// rotation.set_static_state(&sim);
///
/// // Each tick
/// let action = rotation.next_action(&sim);
/// ```
pub struct Rotation<B: RotationBindings> {
    compiler: RotationCompiler,
    bindings: B,
    partial_ast: Option<AST>,
}

impl<B: RotationBindings> Rotation<B> {
    /// Creates a new rotation handler.
    ///
    /// # Errors
    ///
    /// Returns an error if the script fails to compile.
    pub fn new(script: &str, bindings: B) -> Result<Self, String> {
        let compiler = RotationCompiler::compile(script)
            .map_err(|e| e.to_string())?;
        Ok(Self {
            compiler,
            bindings,
            partial_ast: None,
        })
    }

    /// Bakes in static state (talents, config) to create a partial AST.
    ///
    /// Call this when talents or configuration change. The partial AST
    /// will have talent-dependent branches eliminated.
    pub fn set_static_state(&mut self, sim: &SimState) {
        let mut state = self.compiler.new_state();
        self.bindings.update_state(&mut state, self.compiler.schema(), sim);
        self.partial_ast = Some(self.compiler.optimize_partial(&state));
    }

    /// Returns the next action based on current simulation state.
    ///
    /// 1. Updates dynamic state from simulation
    /// 2. Evaluates method calls once and injects results
    /// 3. Optimizes AST (from partial if available)
    /// 4. Extracts action from optimized AST
    pub fn next_action(&self, sim: &SimState) -> Action {
        let mut state = self.compiler.new_state();
        let schema = self.compiler.schema();

        // Update dynamic state
        self.bindings.update_state(&mut state, schema, sim);

        // Evaluate method calls and inject results
        for (slot, value) in self.bindings.evaluate_methods(schema, sim) {
            state.set_bool(slot, value);
        }

        // Optimize and extract
        let ast = match &self.partial_ast {
            Some(partial) => self.compiler.optimize_from_partial(partial, &state),
            None => self.compiler.optimize(&state),
        };

        self.compiler.evaluate_optimized(&ast)
    }

    /// Returns a reference to the underlying compiler.
    #[must_use]
    pub fn compiler(&self) -> &RotationCompiler {
        &self.compiler
    }

    /// Returns a reference to the schema.
    #[must_use]
    pub fn schema(&self) -> &StateSchema {
        self.compiler.schema()
    }
}

/// A no-op bindings implementation for testing.
///
/// This implementation does nothing, useful for testing the rotation
/// system without a full simulation.
#[derive(Debug, Clone, Copy, Default)]
pub struct NoOpBindings;

impl RotationBindings for NoOpBindings {
    fn update_state(&self, _state: &mut GameState, _schema: &StateSchema, _sim: &SimState) {
        // No-op
    }

    fn evaluate_methods(&self, _schema: &StateSchema, _sim: &SimState) -> Vec<(usize, bool)> {
        Vec::new()
    }
}
