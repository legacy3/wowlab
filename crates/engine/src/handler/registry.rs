//! Handler registry - maps spec IDs to handler implementations.

use super::SpecHandler;
use crate::types::SpecId;
use std::collections::HashMap;
use std::sync::Arc;

/// Registry mapping spec IDs to their handlers.
///
/// The registry provides O(1) lookup of handlers by spec ID. Handlers are
/// stored as Arc to allow cloning for parallel simulations.
pub struct HandlerRegistry {
    handlers: HashMap<SpecId, Arc<dyn SpecHandler>>,
}

impl HandlerRegistry {
    /// Create a new empty registry.
    pub fn new() -> Self {
        Self {
            handlers: HashMap::new(),
        }
    }

    /// Register a handler for a spec.
    pub fn register<H: SpecHandler + 'static>(&mut self, handler: H) {
        let spec = handler.spec_id();
        self.handlers.insert(spec, Arc::new(handler));
    }

    /// Register a handler wrapped in Arc.
    pub fn register_arc(&mut self, handler: Arc<dyn SpecHandler>) {
        let spec = handler.spec_id();
        self.handlers.insert(spec, handler);
    }

    /// Get a handler for a spec.
    pub fn get(&self, spec: SpecId) -> Option<Arc<dyn SpecHandler>> {
        self.handlers.get(&spec).cloned()
    }

    /// Check if a handler is registered for a spec.
    pub fn has(&self, spec: SpecId) -> bool {
        self.handlers.contains_key(&spec)
    }

    /// Get list of all registered specs.
    pub fn specs(&self) -> Vec<SpecId> {
        self.handlers.keys().copied().collect()
    }
}

impl Default for HandlerRegistry {
    fn default() -> Self {
        Self::new()
    }
}

/// Global handler registry with all spec handlers.
///
/// This is populated at startup and provides handlers for all supported specs.
#[cfg(feature = "jit")]
pub fn create_default_registry() -> HandlerRegistry {
    use crate::specs::hunter::bm::BmHunter;

    let mut registry = HandlerRegistry::new();

    // Register all implemented specs
    registry.register(BmHunter::new());

    registry
}
