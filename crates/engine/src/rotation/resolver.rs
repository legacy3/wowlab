//! Name resolution for rotations.
//!
//! Provides a SpecResolver that maps spell/aura names to game IDs.
//! Resolution happens at parse time, so the Expr enum contains resolved IDs.

use std::collections::{HashMap, HashSet};

#[cfg(feature = "jit")]
use crate::specs::SpecData;
use crate::types::{AuraIdx, ResourceType, SpellIdx};

use super::error::{Error, Result};

/// Talent information including rank support.
#[derive(Debug, Clone, Copy)]
pub struct TalentInfo {
    /// Whether the talent is enabled.
    pub enabled: bool,
    /// Current rank (1 for enabled talents without explicit rank, 0 for disabled).
    pub rank: i32,
    /// Maximum rank (defaults to 1 for single-rank talents).
    pub max_rank: i32,
}

impl TalentInfo {
    /// Create a simple enabled/disabled talent (rank 1 if enabled).
    pub fn new(enabled: bool) -> Self {
        Self {
            enabled,
            rank: if enabled { 1 } else { 0 },
            max_rank: 1,
        }
    }

    /// Create a ranked talent.
    pub fn ranked(rank: i32, max_rank: i32) -> Self {
        Self {
            enabled: rank > 0,
            rank,
            max_rank,
        }
    }
}

/// Spec-specific name resolver.
///
/// Each spec provides one of these to map rotation names to game IDs.
/// This is a thin wrapper around SpecData that provides the rotation-specific API.
#[derive(Debug, Clone)]
pub struct SpecResolver {
    pub name: String,
    /// Legacy string-based resource type for backwards compatibility.
    resource_type_str: Option<String>,
    /// Map from resource name to ResourceType enum.
    resources: HashMap<String, ResourceType>,
    spells: HashMap<String, SpellIdx>,
    auras: HashMap<String, AuraIdx>,
    dots: HashMap<String, AuraIdx>,
    talents: HashMap<String, TalentInfo>,
    charged_cooldowns: HashSet<String>,
}

impl SpecResolver {
    /// Create a new spec resolver.
    pub fn new(name: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            resource_type_str: None,
            resources: HashMap::new(),
            spells: HashMap::new(),
            auras: HashMap::new(),
            dots: HashMap::new(),
            talents: HashMap::new(),
            charged_cooldowns: HashSet::new(),
        }
    }

    /// Create from a SpecData registry.
    #[cfg(feature = "jit")]
    pub fn from_spec_data(data: &SpecData) -> Self {
        let mut resolver = Self::new(data.name.clone());
        resolver.resource_type_str = data.primary_resource().map(String::from);

        // Register common resources by name
        if let Some(res_name) = data.primary_resource() {
            if let Some(res_type) = resource_name_to_type(res_name) {
                resolver.resources.insert(res_name.to_string(), res_type);
            }
        }

        for (name, id) in data.spells() {
            resolver.spells.insert(name.to_string(), id);
        }
        for (name, id) in data.auras() {
            resolver.auras.insert(name.to_string(), id);
        }
        for (name, id) in data.dots() {
            resolver.dots.insert(name.to_string(), id);
        }
        for (name, enabled) in data.talents_iter() {
            resolver
                .talents
                .insert(name.to_string(), TalentInfo::new(enabled));
        }

        resolver
    }

    /// Set the primary resource type by name.
    pub fn resource(mut self, resource_name: impl Into<String>) -> Self {
        let name = resource_name.into();
        self.resource_type_str = Some(name.clone());
        // Also register by name if we can parse it
        if let Some(res_type) = resource_name_to_type(&name) {
            self.resources.insert(name, res_type);
        }
        self
    }

    /// Register a resource by name with its type.
    pub fn resource_type(mut self, name: impl Into<String>, res_type: ResourceType) -> Self {
        self.resources.insert(name.into(), res_type);
        self
    }

    /// Register a spell.
    pub fn spell(mut self, name: impl Into<String>, id: u32) -> Self {
        self.spells.insert(name.into(), SpellIdx(id));
        self
    }

    /// Register an aura (buff/debuff).
    pub fn aura(mut self, name: impl Into<String>, id: u32) -> Self {
        self.auras.insert(name.into(), AuraIdx(id));
        self
    }

    /// Register a DoT (debuff applied by player).
    pub fn dot(mut self, name: impl Into<String>, id: u32) -> Self {
        let name = name.into();
        self.dots.insert(name.clone(), AuraIdx(id));
        // DoTs are also debuffs
        self.auras.insert(name, AuraIdx(id));
        self
    }

    /// Register a charged cooldown.
    pub fn charged_cooldown(mut self, name: impl Into<String>) -> Self {
        self.charged_cooldowns.insert(name.into());
        self
    }

    /// Register a talent with its current enabled state.
    pub fn talent(mut self, name: impl Into<String>, enabled: bool) -> Self {
        self.talents.insert(name.into(), TalentInfo::new(enabled));
        self
    }

    /// Register a talent with a specific rank.
    pub fn talent_ranked(mut self, name: impl Into<String>, rank: i32, max_rank: i32) -> Self {
        self.talents
            .insert(name.into(), TalentInfo::ranked(rank, max_rank));
        self
    }

    /// Look up a spell by name.
    pub fn resolve_spell(&self, name: &str) -> Result<SpellIdx> {
        self.spells
            .get(name)
            .copied()
            .ok_or_else(|| Error::UnknownSpell(name.to_string()))
    }

    /// Look up an aura by name.
    pub fn resolve_aura(&self, name: &str) -> Result<AuraIdx> {
        self.auras
            .get(name)
            .copied()
            .ok_or_else(|| Error::UnknownAura(name.to_string()))
    }

    /// Look up a DoT by name.
    pub fn resolve_dot(&self, name: &str) -> Result<AuraIdx> {
        self.dots
            .get(name)
            .copied()
            .ok_or_else(|| Error::UnknownAura(name.to_string()))
    }

    /// Check if a talent is enabled.
    pub fn resolve_talent(&self, name: &str) -> Result<bool> {
        self.talents
            .get(name)
            .map(|info| info.enabled)
            .ok_or_else(|| Error::UnknownTalent(name.to_string()))
    }

    /// Get full talent info including rank.
    pub fn resolve_talent_info(&self, name: &str) -> Result<TalentInfo> {
        self.talents
            .get(name)
            .copied()
            .ok_or_else(|| Error::UnknownTalent(name.to_string()))
    }

    /// Check if a cooldown is charged.
    pub fn is_charged(&self, name: &str) -> bool {
        self.charged_cooldowns.contains(name)
    }

    /// Get the primary resource type as a string (legacy).
    pub fn primary_resource(&self) -> Option<&str> {
        self.resource_type_str.as_deref()
    }

    /// Resolve a resource name to its ResourceType.
    pub fn resolve_resource(&self, name: &str) -> Result<ResourceType> {
        // First check if it's explicitly registered
        if let Some(&res_type) = self.resources.get(name) {
            return Ok(res_type);
        }
        // Try to parse the name directly as a resource type
        if let Some(res_type) = resource_name_to_type(name) {
            return Ok(res_type);
        }
        Err(Error::UnknownResource(name.to_string()))
    }

    /// Check if an aura is registered.
    pub fn has_aura(&self, name: &str) -> bool {
        self.auras.contains_key(name)
    }

    /// Check if a DoT is registered.
    pub fn has_dot(&self, name: &str) -> bool {
        self.dots.contains_key(name)
    }

    /// Check if a talent is registered (returns enabled state).
    pub fn has_talent(&self, name: &str) -> bool {
        self.talents
            .get(name)
            .map(|info| info.enabled)
            .unwrap_or(false)
    }
}

/// Convert a resource name string to a ResourceType.
pub fn resource_name_to_type(name: &str) -> Option<ResourceType> {
    match name.to_lowercase().as_str() {
        "mana" => Some(ResourceType::Mana),
        "rage" => Some(ResourceType::Rage),
        "focus" => Some(ResourceType::Focus),
        "energy" => Some(ResourceType::Energy),
        "combo_points" | "combopoints" => Some(ResourceType::ComboPoints),
        "runes" => Some(ResourceType::Runes),
        "runic_power" | "runicpower" => Some(ResourceType::RunicPower),
        "soul_shards" | "soulshards" => Some(ResourceType::SoulShards),
        "lunar_power" | "lunarpower" | "astral_power" | "astralpower" => {
            Some(ResourceType::LunarPower)
        }
        "holy_power" | "holypower" => Some(ResourceType::HolyPower),
        "maelstrom" => Some(ResourceType::Maelstrom),
        "chi" => Some(ResourceType::Chi),
        "insanity" => Some(ResourceType::Insanity),
        "arcane_charges" | "arcanecharges" => Some(ResourceType::ArcaneCharges),
        "fury" => Some(ResourceType::Fury),
        "pain" => Some(ResourceType::Pain),
        "essence" => Some(ResourceType::Essence),
        _ => None,
    }
}

/// Check that a resource name is valid (can be resolved).
pub fn check_resource(r: &str, resolver: &SpecResolver) -> Result<ResourceType> {
    resolver.resolve_resource(r)
}
