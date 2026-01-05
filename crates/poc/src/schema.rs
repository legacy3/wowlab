//! # Schema & State
//!
//! Maps variable names to slot indices for fast scope construction.

use rhai::{Dynamic, Scope};
use std::collections::HashMap;

/// Schema mapping variable names to slot indices.
///
/// Built by walking the AST after compilation to find all referenced variables.
#[derive(Debug, Default, Clone)]
pub struct StateSchema {
    keys: Vec<String>,
    slots: HashMap<String, usize>,
}

impl StateSchema {
    pub fn new() -> Self {
        Self::default()
    }

    /// Register a variable, returning its slot index.
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

    /// Get slot index for a variable name.
    pub fn slot(&self, name: &str) -> Option<usize> {
        self.slots.get(name).copied()
    }

    /// Get all variable names in slot order.
    pub fn keys(&self) -> &[String] {
        &self.keys
    }

    pub fn len(&self) -> usize {
        self.keys.len()
    }

    pub fn is_empty(&self) -> bool {
        self.keys.is_empty()
    }
}

/// Game state using slot-indexed arrays.
///
/// Values are stored in a flat array indexed by slot numbers from the schema,
/// avoiding string allocations and HashMap lookups during scope building.
#[derive(Clone)]
pub struct GameState {
    values: Vec<Dynamic>,
}

impl GameState {
    pub fn new(schema: &StateSchema) -> Self {
        Self {
            values: vec![Dynamic::UNIT; schema.len()],
        }
    }

    #[inline]
    pub fn set_bool(&mut self, slot: usize, value: bool) {
        self.values[slot] = Dynamic::from(value);
    }

    #[inline]
    pub fn set_int(&mut self, slot: usize, value: i64) {
        self.values[slot] = Dynamic::from(value);
    }

    #[inline]
    pub fn set_float(&mut self, slot: usize, value: f64) {
        self.values[slot] = Dynamic::from(value);
    }

    #[inline]
    pub fn get(&self, slot: usize) -> &Dynamic {
        &self.values[slot]
    }

    /// Build a Rhai scope with all values as constants.
    pub fn to_scope<'a>(&self, schema: &'a StateSchema) -> Scope<'a> {
        let mut scope = Scope::new();
        for (key, value) in schema.keys.iter().zip(self.values.iter()) {
            scope.push_constant_dynamic(key.as_str(), value.clone());
        }
        scope
    }
}
