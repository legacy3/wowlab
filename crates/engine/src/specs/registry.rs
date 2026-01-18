//! Centralized spec data registry.
//!
//! Provides a single source of truth for all spell, aura, and talent definitions
//! with bidirectional lookups (name ↔ ID).

use std::collections::HashMap;

use crate::types::{AuraIdx, SpellIdx};

/// Centralized registry for spec-specific game data.
///
/// This struct provides bidirectional lookups for spells, auras, dots, and talents,
/// eliminating the need for duplicate definitions across constants, rotation, and handler files.
#[derive(Debug, Clone)]
pub struct SpecData {
    /// Spec name (e.g., "bm_hunter").
    pub name: String,
    /// Primary resource type (e.g., "focus").
    pub resource_type: Option<String>,
    /// Spell name → ID mapping.
    spell_name_to_id: HashMap<String, SpellIdx>,
    /// Spell ID → name mapping.
    spell_id_to_name: HashMap<SpellIdx, String>,
    /// Aura name → ID mapping.
    aura_name_to_id: HashMap<String, AuraIdx>,
    /// Aura ID → name mapping.
    aura_id_to_name: HashMap<AuraIdx, String>,
    /// DoT name → ID mapping (subset of auras).
    dot_name_to_id: HashMap<String, AuraIdx>,
    /// DoT ID → name mapping.
    dot_id_to_name: HashMap<AuraIdx, String>,
    /// Talent name → enabled state.
    talents: HashMap<String, bool>,
    /// Charged cooldown spell names.
    charged_cooldowns: std::collections::HashSet<String>,
}

impl SpecData {
    /// Create a new spec data registry.
    pub fn new(name: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            resource_type: None,
            spell_name_to_id: HashMap::new(),
            spell_id_to_name: HashMap::new(),
            aura_name_to_id: HashMap::new(),
            aura_id_to_name: HashMap::new(),
            dot_name_to_id: HashMap::new(),
            dot_id_to_name: HashMap::new(),
            talents: HashMap::new(),
            charged_cooldowns: std::collections::HashSet::new(),
        }
    }

    /// Set the primary resource type.
    pub fn resource(mut self, resource_type: impl Into<String>) -> Self {
        self.resource_type = Some(resource_type.into());
        self
    }

    /// Register a spell with bidirectional lookup.
    pub fn spell(mut self, name: impl Into<String>, id: SpellIdx) -> Self {
        let name = name.into();
        self.spell_name_to_id.insert(name.clone(), id);
        self.spell_id_to_name.insert(id, name);
        self
    }

    /// Register an aura (buff/debuff) with bidirectional lookup.
    pub fn aura(mut self, name: impl Into<String>, id: AuraIdx) -> Self {
        let name = name.into();
        self.aura_name_to_id.insert(name.clone(), id);
        self.aura_id_to_name.insert(id, name);
        self
    }

    /// Register a DoT with bidirectional lookup.
    /// DoTs are also registered as auras.
    pub fn dot(mut self, name: impl Into<String>, id: AuraIdx) -> Self {
        let name = name.into();
        self.dot_name_to_id.insert(name.clone(), id);
        self.dot_id_to_name.insert(id, name.clone());
        // DoTs are also auras
        self.aura_name_to_id.insert(name.clone(), id);
        self.aura_id_to_name.insert(id, name);
        self
    }

    /// Register a talent with its enabled state.
    pub fn talent(mut self, name: impl Into<String>, enabled: bool) -> Self {
        self.talents.insert(name.into(), enabled);
        self
    }

    /// Register a charged cooldown.
    pub fn charged_cooldown(mut self, name: impl Into<String>) -> Self {
        self.charged_cooldowns.insert(name.into());
        self
    }

    // =========================================================================
    // Name → ID lookups
    // =========================================================================

    /// Look up spell ID by name.
    pub fn spell_id(&self, name: &str) -> Option<SpellIdx> {
        self.spell_name_to_id.get(name).copied()
    }

    /// Look up aura ID by name.
    pub fn aura_id(&self, name: &str) -> Option<AuraIdx> {
        self.aura_name_to_id.get(name).copied()
    }

    /// Look up DoT ID by name.
    pub fn dot_id(&self, name: &str) -> Option<AuraIdx> {
        self.dot_name_to_id.get(name).copied()
    }

    // =========================================================================
    // ID → Name lookups
    // =========================================================================

    /// Look up spell name by ID.
    pub fn spell_name(&self, id: SpellIdx) -> Option<&str> {
        self.spell_id_to_name.get(&id).map(|s| s.as_str())
    }

    /// Look up aura name by ID.
    pub fn aura_name(&self, id: AuraIdx) -> Option<&str> {
        self.aura_id_to_name.get(&id).map(|s| s.as_str())
    }

    /// Look up DoT name by ID.
    pub fn dot_name(&self, id: AuraIdx) -> Option<&str> {
        self.dot_id_to_name.get(&id).map(|s| s.as_str())
    }

    // =========================================================================
    // Other lookups
    // =========================================================================

    /// Check if a talent is enabled.
    pub fn talent_enabled(&self, name: &str) -> Option<bool> {
        self.talents.get(name).copied()
    }

    /// Check if a cooldown is charged.
    pub fn is_charged(&self, name: &str) -> bool {
        self.charged_cooldowns.contains(name)
    }

    /// Get the primary resource type.
    pub fn primary_resource(&self) -> Option<&str> {
        self.resource_type.as_deref()
    }

    /// Check if a spell is registered.
    pub fn has_spell(&self, name: &str) -> bool {
        self.spell_name_to_id.contains_key(name)
    }

    /// Check if an aura is registered.
    pub fn has_aura(&self, name: &str) -> bool {
        self.aura_name_to_id.contains_key(name)
    }

    /// Check if a DoT is registered.
    pub fn has_dot(&self, name: &str) -> bool {
        self.dot_name_to_id.contains_key(name)
    }

    /// Check if a talent is registered.
    pub fn has_talent(&self, name: &str) -> bool {
        self.talents.contains_key(name)
    }

    // =========================================================================
    // Iterators
    // =========================================================================

    /// Iterate over all spell name/ID pairs.
    pub fn spells(&self) -> impl Iterator<Item = (&str, SpellIdx)> {
        self.spell_name_to_id.iter().map(|(k, v)| (k.as_str(), *v))
    }

    /// Iterate over all aura name/ID pairs.
    pub fn auras(&self) -> impl Iterator<Item = (&str, AuraIdx)> {
        self.aura_name_to_id.iter().map(|(k, v)| (k.as_str(), *v))
    }

    /// Iterate over all DoT name/ID pairs.
    pub fn dots(&self) -> impl Iterator<Item = (&str, AuraIdx)> {
        self.dot_name_to_id.iter().map(|(k, v)| (k.as_str(), *v))
    }

    /// Iterate over all talent name/enabled pairs.
    pub fn talents_iter(&self) -> impl Iterator<Item = (&str, bool)> {
        self.talents.iter().map(|(k, v)| (k.as_str(), *v))
    }

    // =========================================================================
    // Statistics
    // =========================================================================

    /// Get the number of registered spells.
    pub fn spell_count(&self) -> usize {
        self.spell_name_to_id.len()
    }

    /// Get the number of registered auras.
    pub fn aura_count(&self) -> usize {
        self.aura_name_to_id.len()
    }

    /// Get the number of registered DoTs.
    pub fn dot_count(&self) -> usize {
        self.dot_name_to_id.len()
    }

    /// Get the number of registered talents.
    pub fn talent_count(&self) -> usize {
        self.talents.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_spell_bidirectional_lookup() {
        let data = SpecData::new("test")
            .spell("kill_command", SpellIdx(34026))
            .spell("cobra_shot", SpellIdx(193455));

        // Name → ID
        assert_eq!(data.spell_id("kill_command"), Some(SpellIdx(34026)));
        assert_eq!(data.spell_id("cobra_shot"), Some(SpellIdx(193455)));
        assert_eq!(data.spell_id("unknown"), None);

        // ID → Name
        assert_eq!(data.spell_name(SpellIdx(34026)), Some("kill_command"));
        assert_eq!(data.spell_name(SpellIdx(193455)), Some("cobra_shot"));
        assert_eq!(data.spell_name(SpellIdx(99999)), None);
    }

    #[test]
    fn test_aura_bidirectional_lookup() {
        let data = SpecData::new("test")
            .aura("bestial_wrath", AuraIdx(19574))
            .aura("frenzy", AuraIdx(272790));

        // Name → ID
        assert_eq!(data.aura_id("bestial_wrath"), Some(AuraIdx(19574)));
        assert_eq!(data.aura_id("frenzy"), Some(AuraIdx(272790)));

        // ID → Name
        assert_eq!(data.aura_name(AuraIdx(19574)), Some("bestial_wrath"));
        assert_eq!(data.aura_name(AuraIdx(272790)), Some("frenzy"));
    }

    #[test]
    fn test_dot_also_registers_as_aura() {
        let data = SpecData::new("test").dot("serpent_sting", AuraIdx(271788));

        // DoT lookup
        assert_eq!(data.dot_id("serpent_sting"), Some(AuraIdx(271788)));
        assert_eq!(data.dot_name(AuraIdx(271788)), Some("serpent_sting"));

        // Also available as aura
        assert_eq!(data.aura_id("serpent_sting"), Some(AuraIdx(271788)));
        assert_eq!(data.aura_name(AuraIdx(271788)), Some("serpent_sting"));
    }

    #[test]
    fn test_talents() {
        let data = SpecData::new("test")
            .talent("killer_cobra", true)
            .talent("bloodshed", false);

        assert_eq!(data.talent_enabled("killer_cobra"), Some(true));
        assert_eq!(data.talent_enabled("bloodshed"), Some(false));
        assert_eq!(data.talent_enabled("unknown"), None);
    }

    #[test]
    fn test_charged_cooldowns() {
        let data = SpecData::new("test").charged_cooldown("barbed_shot");

        assert!(data.is_charged("barbed_shot"));
        assert!(!data.is_charged("kill_command"));
    }

    #[test]
    fn test_resource() {
        let data = SpecData::new("test").resource("focus");

        assert_eq!(data.primary_resource(), Some("focus"));
    }
}
