use wowlab_common::types::ResourceType;

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

    pub fn set_max(&mut self, max: f32) {
        self.max = max;
        if self.current > self.max {
            self.current = self.max;
        }
    }

    #[inline]
    pub fn current_int(&self) -> u32 {
        self.current as u32
    }

    #[inline]
    pub fn can_afford(&self, cost: f32) -> bool {
        self.current >= cost
    }

    pub fn spend(&mut self, amount: f32) -> bool {
        if self.current >= amount {
            self.current -= amount;
            true
        } else {
            false
        }
    }

    pub fn gain(&mut self, amount: f32) {
        self.current = (self.current + amount).min(self.max);
    }

    pub fn set(&mut self, value: f32) {
        self.current = value.clamp(0.0, self.max);
    }

    #[inline]
    pub fn percent(&self) -> f32 {
        self.current / self.max
    }

    #[inline]
    pub fn deficit(&self) -> f32 {
        self.max - self.current
    }
}

#[derive(Clone, Debug, Default)]
pub struct UnitResources {
    pub primary: Option<ResourcePool>,
    pub secondary: Option<ResourcePool>,
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
