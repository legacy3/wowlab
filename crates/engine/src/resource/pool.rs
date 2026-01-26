use wowlab_common::types::ResourceType;

/// A single resource pool (Focus, Energy, Rage, etc.)
#[derive(Clone, Debug)]
pub struct ResourcePool {
    pub resource_type: ResourceType,
    pub current: f32,
    pub max: f32,
}

impl ResourcePool {
    pub fn new(resource_type: ResourceType) -> Self {
        let max = resource_type.base_max() as f32;
        Self {
            resource_type,
            current: max,
            max,
        }
    }

    pub fn new_empty(resource_type: ResourceType) -> Self {
        Self {
            resource_type,
            current: 0.0,
            max: resource_type.base_max() as f32,
        }
    }

    /// Set max, clamping current if needed
    pub fn set_max(&mut self, max: f32) {
        self.max = max;
        if self.current > self.max {
            self.current = self.max;
        }
    }

    /// Current as integer (for display, thresholds)
    #[inline]
    pub fn current_int(&self) -> u32 {
        self.current as u32
    }

    /// Can afford cost?
    #[inline]
    pub fn can_afford(&self, cost: f32) -> bool {
        self.current >= cost
    }

    /// Spend resource (returns false if can't afford)
    pub fn spend(&mut self, amount: f32) -> bool {
        if self.current >= amount {
            self.current -= amount;
            true
        } else {
            false
        }
    }

    /// Gain resource (capped at max)
    pub fn gain(&mut self, amount: f32) {
        self.current = (self.current + amount).min(self.max);
    }

    /// Set to specific value
    pub fn set(&mut self, value: f32) {
        self.current = value.clamp(0.0, self.max);
    }

    /// Percentage full (0.0 to 1.0)
    #[inline]
    pub fn percent(&self) -> f32 {
        self.current / self.max
    }

    /// How much is missing
    #[inline]
    pub fn deficit(&self) -> f32 {
        self.max - self.current
    }
}

/// Container for all resources a unit might have
#[derive(Clone, Debug, Default)]
pub struct UnitResources {
    /// Primary resource (Focus, Energy, etc.)
    pub primary: Option<ResourcePool>,
    /// Secondary resource (Combo Points, etc.)
    pub secondary: Option<ResourcePool>,
    /// Mana (for hybrids)
    pub mana: Option<ResourcePool>,
}

impl UnitResources {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn with_primary(mut self, resource_type: ResourceType) -> Self {
        self.primary = Some(ResourcePool::new(resource_type));
        self
    }

    pub fn with_primary_empty(mut self, resource_type: ResourceType) -> Self {
        self.primary = Some(ResourcePool::new_empty(resource_type));
        self
    }

    pub fn with_secondary(mut self, resource_type: ResourceType) -> Self {
        self.secondary = Some(ResourcePool::new_empty(resource_type));
        self
    }

    /// Get resource by type
    pub fn get(&self, resource_type: ResourceType) -> Option<&ResourcePool> {
        if let Some(ref p) = self.primary {
            if p.resource_type == resource_type {
                return Some(p);
            }
        }
        if let Some(ref s) = self.secondary {
            if s.resource_type == resource_type {
                return Some(s);
            }
        }
        if let Some(ref m) = self.mana {
            if m.resource_type == resource_type {
                return Some(m);
            }
        }
        None
    }

    /// Get mutable resource by type
    pub fn get_mut(&mut self, resource_type: ResourceType) -> Option<&mut ResourcePool> {
        if let Some(ref mut p) = self.primary {
            if p.resource_type == resource_type {
                return Some(p);
            }
        }
        if let Some(ref mut s) = self.secondary {
            if s.resource_type == resource_type {
                return Some(s);
            }
        }
        if let Some(ref mut m) = self.mana {
            if m.resource_type == resource_type {
                return Some(m);
            }
        }
        None
    }
}
