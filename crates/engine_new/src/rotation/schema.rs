//! Schema and state management for rotation scripts.
//!
//! Maps variable names to slot indices for fast scope construction.
//!
//! # Slot Types
//!
//! - **Property slots**: Static state lookups (`$talent.foo.enabled` -> `talent_foo_enabled`)
//! - **Method slots**: Dynamic call results (`$spell.bar.ready()` -> `__m0`)
//!
//! At runtime, the caller provides values for both slot types.
//! The Rhai optimizer treats all values as constants for aggressive folding.

use crate::rotation::preprocess::MethodCall;
use rhai::{Dynamic, Scope};
use std::collections::HashMap;

/// Schema mapping variable names to slot indices.
///
/// The schema is built during compilation by extracting all variable references
/// from the AST. Each unique variable gets a slot index, which is used for
/// fast value lookup during evaluation.
#[derive(Debug, Default, Clone)]
pub struct StateSchema {
    /// All variable names in slot order.
    keys: Vec<String>,
    /// Variable name to slot index mapping.
    slots: HashMap<String, usize>,
    /// Extracted method calls (for runtime evaluation).
    method_calls: Vec<MethodCall>,
}

impl StateSchema {
    /// Creates a new empty schema.
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    /// Registers a variable and returns its slot index.
    ///
    /// If the variable is already registered, returns the existing slot.
    pub fn register(&mut self, name: &str) -> usize {
        if let Some(&slot) = self.slots.get(name) {
            slot
        } else {
            let slot = self.keys.len();
            self.keys.push(name.to_string());
            self.slots.insert(name.to_string(), slot);
            slot
        }
    }

    /// Sets the extracted method calls for this schema.
    pub fn set_method_calls(&mut self, calls: Vec<MethodCall>) {
        self.method_calls = calls;
    }

    /// Returns the extracted method calls.
    ///
    /// These need to be evaluated once per tick and injected into the state.
    #[must_use]
    pub fn method_calls(&self) -> &[MethodCall] {
        &self.method_calls
    }

    /// Returns the slot index for a variable name.
    #[must_use]
    pub fn slot(&self, name: &str) -> Option<usize> {
        self.slots.get(name).copied()
    }

    /// Returns all variable names in slot order.
    #[must_use]
    pub fn keys(&self) -> &[String] {
        &self.keys
    }

    /// Returns the number of registered variables.
    #[must_use]
    pub fn len(&self) -> usize {
        self.keys.len()
    }

    /// Returns true if no variables are registered.
    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.keys.is_empty()
    }
}

/// Game state using slot-indexed arrays for fast access.
///
/// Values are stored in a flat array indexed by slot number. This allows
/// O(1) access and efficient scope construction for the Rhai optimizer.
#[derive(Clone, Debug)]
pub struct GameState {
    values: Vec<Dynamic>,
}

impl GameState {
    /// Creates a new state with all slots initialized to unit values.
    #[must_use]
    pub fn new(schema: &StateSchema) -> Self {
        Self {
            values: vec![Dynamic::UNIT; schema.len()],
        }
    }

    /// Sets a slot to an arbitrary dynamic value.
    #[inline]
    pub fn set(&mut self, slot: usize, value: Dynamic) {
        self.values[slot] = value;
    }

    /// Sets a slot to a boolean value.
    #[inline]
    pub fn set_bool(&mut self, slot: usize, value: bool) {
        self.values[slot] = Dynamic::from(value);
    }

    /// Sets a slot to an integer value.
    #[inline]
    pub fn set_int(&mut self, slot: usize, value: i64) {
        self.values[slot] = Dynamic::from(value);
    }

    /// Sets a slot to a floating-point value.
    #[inline]
    pub fn set_float(&mut self, slot: usize, value: f64) {
        self.values[slot] = Dynamic::from(value);
    }

    /// Returns the value at the given slot.
    #[inline]
    pub fn get(&self, slot: usize) -> &Dynamic {
        &self.values[slot]
    }

    /// Builds a Rhai scope with all non-unit values injected as constants.
    ///
    /// The resulting scope can be passed to `Engine::optimize_ast` for
    /// constant folding and dead code elimination.
    ///
    /// Values that are `()` (unit) are skipped, leaving them as variables
    /// in the AST. This allows two-pass optimization where static values
    /// are baked in first, and dynamic values are added later.
    #[must_use]
    pub fn to_scope<'a>(&self, schema: &'a StateSchema) -> Scope<'a> {
        let mut scope = Scope::new();
        for (key, value) in schema.keys.iter().zip(self.values.iter()) {
            // Skip unit values so they remain as variables in the AST
            if !value.is_unit() {
                scope.push_constant_dynamic(key.as_str(), value.clone());
            }
        }
        scope
    }
}
