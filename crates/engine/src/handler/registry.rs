//! Handler registry - maps spec IDs to handler implementations.

use super::SpecHandler;
use wowlab_common::types::SpecId;
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

    /// Get a handler by WoW API spec ID.
    pub fn get_by_wow_id(&self, wow_spec_id: u32) -> Option<Arc<dyn SpecHandler>> {
        let spec = SpecId::from_wow_spec_id(wow_spec_id)?;
        self.get(spec)
    }

    /// Get all registered handlers.
    pub fn handlers(&self) -> impl Iterator<Item = &Arc<dyn SpecHandler>> {
        self.handlers.values()
    }
}

impl Default for HandlerRegistry {
    fn default() -> Self {
        Self::new()
    }
}

/// Create a spec handler for the given spec with rotation and talents.
#[cfg(feature = "jit")]
pub fn create_handler(
    spec_id: SpecId,
    rotation_json: &str,
) -> Result<Arc<dyn SpecHandler>, String> {
    use crate::specs::hunter::bm::{BmHunter, TalentFlags, TierSetFlags};
    use crate::specs::hunter::mm::MmHunter;

    match spec_id {
        SpecId::BeastMastery => {
            let handler = BmHunter::new(rotation_json, TalentFlags::empty(), TierSetFlags::NONE)?;
            Ok(Arc::new(handler))
        }
        SpecId::Marksmanship => {
            let handler = MmHunter::new(rotation_json)?;
            Ok(Arc::new(handler))
        }
        _ => Err(format!("Spec {:?} not implemented", spec_id)),
    }
}
