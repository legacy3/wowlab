//! Resource expressions (focus, mana, etc.).

use serde::{Deserialize, Serialize};

#[cfg(feature = "wasm")]
use tsify::Tsify;

use crate::resource::ResourceRegen;
use crate::sim::SimState;
use crate::types::{ResourceType, SimTime};

use super::{write_f64, FieldType, PopulateContext};

/// Resource-related expressions.
///
/// All variants take a `resource` parameter specifying which resource to query.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum ResourceExpr {
    /// Current resource amount.
    ResourceCurrent { resource: ResourceType },
    /// Maximum resource capacity.
    ResourceMax { resource: ResourceType },
    /// Deficit from max resource (max - current).
    ResourceDeficit { resource: ResourceType },
    /// Resource as percentage (0-100).
    ResourcePercent { resource: ResourceType },
    /// Deficit as percentage of max (0-100).
    ResourceDeficitPercent { resource: ResourceType },
    /// Haste-adjusted regeneration rate per second.
    ResourceRegen { resource: ResourceType },
    /// Seconds until resource reaches maximum.
    ResourceTimeToMax { resource: ResourceType },
    /// Seconds until resource reaches a specific amount.
    ResourceTimeTo { resource: ResourceType, amount: f64 },
}

impl ResourceExpr {
    /// Get the resource type this expression references.
    pub fn resource_type(&self) -> ResourceType {
        match self {
            Self::ResourceCurrent { resource }
            | Self::ResourceMax { resource }
            | Self::ResourceDeficit { resource }
            | Self::ResourcePercent { resource }
            | Self::ResourceDeficitPercent { resource }
            | Self::ResourceRegen { resource }
            | Self::ResourceTimeToMax { resource }
            | Self::ResourceTimeTo { resource, .. } => *resource,
        }
    }
}

/// Implement Hash and Eq manually since f64 doesn't implement Eq.
/// We use bit-for-bit comparison for the amount field.
impl std::hash::Hash for ResourceExpr {
    fn hash<H: std::hash::Hasher>(&self, state: &mut H) {
        std::mem::discriminant(self).hash(state);
        match self {
            Self::ResourceCurrent { resource }
            | Self::ResourceMax { resource }
            | Self::ResourceDeficit { resource }
            | Self::ResourcePercent { resource }
            | Self::ResourceDeficitPercent { resource }
            | Self::ResourceRegen { resource }
            | Self::ResourceTimeToMax { resource } => {
                resource.hash(state);
            }
            Self::ResourceTimeTo { resource, amount } => {
                resource.hash(state);
                amount.to_bits().hash(state);
            }
        }
    }
}

impl Eq for ResourceExpr {}

impl PopulateContext for ResourceExpr {
    fn populate(&self, buffer: &mut [u8], offset: usize, state: &SimState, _now: SimTime) {
        match self {
            Self::ResourceCurrent { resource } => {
                let value = state
                    .player
                    .resources
                    .get(*resource)
                    .map(|r| r.current as f64)
                    .unwrap_or(0.0);
                write_f64(buffer, offset, value);
            }
            Self::ResourceMax { resource } => {
                let value = state
                    .player
                    .resources
                    .get(*resource)
                    .map(|r| r.max as f64)
                    .unwrap_or(0.0);
                write_f64(buffer, offset, value);
            }
            Self::ResourceDeficit { resource } => {
                let value = state
                    .player
                    .resources
                    .get(*resource)
                    .map(|r| (r.max - r.current) as f64)
                    .unwrap_or(0.0);
                write_f64(buffer, offset, value);
            }
            Self::ResourcePercent { resource } => {
                let value = state
                    .player
                    .resources
                    .get(*resource)
                    .map(|r| {
                        if r.max > 0.0 {
                            (r.current / r.max) * 100.0
                        } else {
                            0.0
                        }
                    })
                    .unwrap_or(0.0) as f64;
                write_f64(buffer, offset, value);
            }
            Self::ResourceDeficitPercent { resource } => {
                let value = state
                    .player
                    .resources
                    .get(*resource)
                    .map(|r| {
                        if r.max > 0.0 {
                            ((r.max - r.current) / r.max) * 100.0
                        } else {
                            0.0
                        }
                    })
                    .unwrap_or(0.0) as f64;
                write_f64(buffer, offset, value);
            }
            Self::ResourceRegen { resource } => {
                // Calculate haste-adjusted regen per second
                let base_regen = resource.base_regen_per_sec();
                let haste = state.player.stats.haste();
                let regen_per_sec = base_regen * haste;
                write_f64(buffer, offset, regen_per_sec as f64);
            }
            Self::ResourceTimeToMax { resource } => {
                let value = state
                    .player
                    .resources
                    .get(*resource)
                    .map(|r| {
                        let haste = state.player.stats.haste();
                        ResourceRegen::time_to_reach(r, r.max, haste)
                            .map(|t| t.as_secs_f64())
                            .unwrap_or(f64::INFINITY)
                    })
                    .unwrap_or(0.0);
                write_f64(buffer, offset, value);
            }
            Self::ResourceTimeTo { resource, amount } => {
                let target = *amount as f32;
                let value = state
                    .player
                    .resources
                    .get(*resource)
                    .map(|r| {
                        let haste = state.player.stats.haste();
                        ResourceRegen::time_to_reach(r, target, haste)
                            .map(|t| t.as_secs_f64())
                            .unwrap_or(f64::INFINITY)
                    })
                    .unwrap_or(0.0);
                write_f64(buffer, offset, value);
            }
        }
    }

    fn field_type(&self) -> FieldType {
        FieldType::Float
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_resource_expr_serialization() {
        let expr = ResourceExpr::ResourceCurrent {
            resource: ResourceType::Focus,
        };
        let json = serde_json::to_string(&expr).unwrap();
        assert!(json.contains("resourceCurrent"));
        assert!(json.contains("Focus"));

        let parsed: ResourceExpr = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed, expr);
    }

    #[test]
    fn test_resource_time_to_serialization() {
        let expr = ResourceExpr::ResourceTimeTo {
            resource: ResourceType::Energy,
            amount: 50.0,
        };
        let json = serde_json::to_string(&expr).unwrap();
        assert!(json.contains("resourceTimeTo"));
        assert!(json.contains("Energy"));
        assert!(json.contains("50"));

        let parsed: ResourceExpr = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed, expr);
    }

    #[test]
    fn test_resource_expr_hash_eq() {
        use std::collections::HashSet;

        let mut set = HashSet::new();
        set.insert(ResourceExpr::ResourceCurrent {
            resource: ResourceType::Focus,
        });
        set.insert(ResourceExpr::ResourceCurrent {
            resource: ResourceType::Focus,
        });

        assert_eq!(set.len(), 1);

        set.insert(ResourceExpr::ResourceTimeTo {
            resource: ResourceType::Focus,
            amount: 50.0,
        });
        set.insert(ResourceExpr::ResourceTimeTo {
            resource: ResourceType::Focus,
            amount: 50.0,
        });

        assert_eq!(set.len(), 2);
    }

    #[test]
    fn test_all_variants_field_type() {
        let variants = [
            ResourceExpr::ResourceCurrent {
                resource: ResourceType::Focus,
            },
            ResourceExpr::ResourceMax {
                resource: ResourceType::Focus,
            },
            ResourceExpr::ResourceDeficit {
                resource: ResourceType::Focus,
            },
            ResourceExpr::ResourcePercent {
                resource: ResourceType::Focus,
            },
            ResourceExpr::ResourceDeficitPercent {
                resource: ResourceType::Focus,
            },
            ResourceExpr::ResourceRegen {
                resource: ResourceType::Focus,
            },
            ResourceExpr::ResourceTimeToMax {
                resource: ResourceType::Focus,
            },
            ResourceExpr::ResourceTimeTo {
                resource: ResourceType::Focus,
                amount: 50.0,
            },
        ];

        for variant in &variants {
            assert_eq!(variant.field_type(), FieldType::Float);
        }
    }

    #[test]
    fn test_all_variants_json_roundtrip() {
        let variants = [
            ResourceExpr::ResourceCurrent {
                resource: ResourceType::Focus,
            },
            ResourceExpr::ResourceMax {
                resource: ResourceType::Mana,
            },
            ResourceExpr::ResourceDeficit {
                resource: ResourceType::Energy,
            },
            ResourceExpr::ResourcePercent {
                resource: ResourceType::Rage,
            },
            ResourceExpr::ResourceDeficitPercent {
                resource: ResourceType::ComboPoints,
            },
            ResourceExpr::ResourceRegen {
                resource: ResourceType::Focus,
            },
            ResourceExpr::ResourceTimeToMax {
                resource: ResourceType::Energy,
            },
            ResourceExpr::ResourceTimeTo {
                resource: ResourceType::Focus,
                amount: 75.5,
            },
        ];

        for variant in &variants {
            let json = serde_json::to_string(variant).unwrap();
            let parsed: ResourceExpr = serde_json::from_str(&json).unwrap();
            assert_eq!(&parsed, variant, "Failed roundtrip for: {:?}", variant);
        }
    }

    #[test]
    fn test_resource_type_accessor() {
        let expr = ResourceExpr::ResourceDeficit {
            resource: ResourceType::Energy,
        };
        assert_eq!(expr.resource_type(), ResourceType::Energy);

        let expr2 = ResourceExpr::ResourceTimeTo {
            resource: ResourceType::Mana,
            amount: 100.0,
        };
        assert_eq!(expr2.resource_type(), ResourceType::Mana);
    }

    #[test]
    fn test_different_resources_different_keys() {
        use std::collections::HashSet;

        let mut set = HashSet::new();
        set.insert(ResourceExpr::ResourceCurrent {
            resource: ResourceType::Focus,
        });
        set.insert(ResourceExpr::ResourceCurrent {
            resource: ResourceType::Energy,
        });

        // Different resources should be different keys
        assert_eq!(set.len(), 2);
    }

    #[test]
    fn test_resource_time_to_different_amounts() {
        use std::collections::HashSet;

        let mut set = HashSet::new();
        set.insert(ResourceExpr::ResourceTimeTo {
            resource: ResourceType::Focus,
            amount: 50.0,
        });
        set.insert(ResourceExpr::ResourceTimeTo {
            resource: ResourceType::Focus,
            amount: 75.0,
        });

        // Different amounts should be different keys
        assert_eq!(set.len(), 2);
    }
}
