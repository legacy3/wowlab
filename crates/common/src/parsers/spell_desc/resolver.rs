//! Resolver trait for spell description rendering.
//!
//! The resolver provides values for variables during rendering. In WASM,
//! this is implemented by a JavaScript object with callback functions.

/// Trait for resolving spell description values.
///
/// Implementors provide data lookups for:
/// - Effect values (base points, min/max, tick period, etc.)
/// - Spell-level values (duration, charges, range, etc.)
/// - Player stats (spell power, attack power, haste, etc.)
/// - Custom variables (from spell's description_variables)
/// - Spell/aura knowledge checks (for conditionals)
/// - Gender (for $g tokens)
/// - Recursive spell description embedding
pub trait SpellDescResolver {
    /// Get an effect value.
    ///
    /// # Arguments
    /// * `spell_id` - The spell ID
    /// * `effect_index` - The 1-indexed effect index
    /// * `var_type` - The variable type:
    ///   - "s" - base points
    ///   - "m" - min value
    ///   - "M" - max value
    ///   - "t" - tick period (seconds)
    ///   - "a" - radius
    ///   - "A" - max radius
    ///   - "x" - chain targets
    ///   - "o" - total over time (ticks * base)
    ///   - "e" - multiple value
    ///   - "w" - weapon damage bonus
    ///   - "bc" - bonus coefficient
    ///   - "q" - quality
    ///
    /// # Returns
    /// The value as f64, or None if not available.
    fn get_effect_value(&self, spell_id: u32, effect_index: u8, var_type: &str) -> Option<f64>;

    /// Get a spell-level value as a formatted string.
    ///
    /// # Arguments
    /// * `spell_id` - The spell ID
    /// * `var_type` - The variable type:
    ///   - "d" - duration (e.g., "8 sec", "1 min")
    ///   - "n" - charges
    ///   - "r" - range (e.g., "40 yd")
    ///   - "h" - proc chance (e.g., "10%")
    ///   - "u" - max stacks
    ///   - "i" - icon path
    ///   - "p" - power cost
    ///   - "z" - zone requirement
    ///   - "c" - cast time
    ///
    /// # Returns
    /// The formatted string, or None if not available.
    fn get_spell_value(&self, spell_id: u32, var_type: &str) -> Option<String>;

    /// Get a player stat value.
    ///
    /// # Arguments
    /// * `stat` - The stat name:
    ///   - "SP" / "sp" - spell power
    ///   - "AP" / "ap" - attack power
    ///   - "RAP" - ranged attack power
    ///   - "MHP" / "mhp" - max health
    ///   - "SPS" - spell power (scaled)
    ///   - "PL" / "pl" - player level
    ///   - "INT" - intellect
    ///
    /// # Returns
    /// The stat value, or None if not available.
    fn get_player_stat(&self, stat: &str) -> Option<f64>;

    /// Get a custom variable value from the spell's description_variables.
    ///
    /// # Arguments
    /// * `name` - The variable name (without $< and >)
    ///
    /// # Returns
    /// The variable value, or None if not defined.
    fn get_custom_var(&self, name: &str) -> Option<f64>;

    /// Check if the player knows a spell.
    ///
    /// Used for $?sXXXXX conditionals.
    fn knows_spell(&self, spell_id: u32) -> bool;

    /// Check if an aura is active on the player.
    ///
    /// Used for $?aXXXXX conditionals.
    fn has_aura(&self, aura_id: u32) -> bool;

    /// Check if the player is a specific class.
    ///
    /// Used for $?cX conditionals.
    fn is_class(&self, class_id: u32) -> bool;

    /// Get the player's gender.
    ///
    /// Returns true for male, false for female.
    fn is_male(&self) -> bool;

    /// Get another spell's rendered description.
    ///
    /// Used for @spelldesc embedding. The implementation should call
    /// `render_with_resolver` recursively with appropriate depth limiting.
    ///
    /// # Arguments
    /// * `spell_id` - The spell ID to get the description for
    ///
    /// # Returns
    /// The rendered description, or None if not available.
    fn get_spell_description(&self, spell_id: u32) -> Option<String>;

    /// Get another spell's name.
    ///
    /// Used for @spellname embedding.
    fn get_spell_name(&self, spell_id: u32) -> Option<String>;

    /// Get another spell's icon path.
    ///
    /// Used for @spellicon embedding.
    fn get_spell_icon(&self, spell_id: u32) -> Option<String>;
}

/// A no-op resolver that returns None for everything.
///
/// Useful for testing the parser without actual data.
#[derive(Debug, Default)]
pub struct NullResolver;

impl SpellDescResolver for NullResolver {
    fn get_effect_value(&self, _spell_id: u32, _effect_index: u8, _var_type: &str) -> Option<f64> {
        None
    }

    fn get_spell_value(&self, _spell_id: u32, _var_type: &str) -> Option<String> {
        None
    }

    fn get_player_stat(&self, _stat: &str) -> Option<f64> {
        None
    }

    fn get_custom_var(&self, _name: &str) -> Option<f64> {
        None
    }

    fn knows_spell(&self, _spell_id: u32) -> bool {
        false
    }

    fn has_aura(&self, _aura_id: u32) -> bool {
        false
    }

    fn is_class(&self, _class_id: u32) -> bool {
        false
    }

    fn is_male(&self) -> bool {
        true
    }

    fn get_spell_description(&self, _spell_id: u32) -> Option<String> {
        None
    }

    fn get_spell_name(&self, _spell_id: u32) -> Option<String> {
        None
    }

    fn get_spell_icon(&self, _spell_id: u32) -> Option<String> {
        None
    }
}

/// A test resolver with pre-configured values.
#[derive(Debug, Default)]
pub struct TestResolver {
    pub effects: std::collections::HashMap<(u32, u8, String), f64>,
    pub spell_values: std::collections::HashMap<(u32, String), String>,
    pub player_stats: std::collections::HashMap<String, f64>,
    pub custom_vars: std::collections::HashMap<String, f64>,
    pub known_spells: std::collections::HashSet<u32>,
    pub active_auras: std::collections::HashSet<u32>,
    pub player_class: Option<u32>,
    pub is_male: bool,
    pub spell_descriptions: std::collections::HashMap<u32, String>,
    pub spell_names: std::collections::HashMap<u32, String>,
}

impl TestResolver {
    pub fn new() -> Self {
        Self {
            is_male: true,
            ..Default::default()
        }
    }

    pub fn with_effect(
        mut self,
        spell_id: u32,
        effect_index: u8,
        var_type: &str,
        value: f64,
    ) -> Self {
        self.effects
            .insert((spell_id, effect_index, var_type.to_string()), value);
        self
    }

    pub fn with_spell_value(mut self, spell_id: u32, var_type: &str, value: &str) -> Self {
        self.spell_values
            .insert((spell_id, var_type.to_string()), value.to_string());
        self
    }

    pub fn with_player_stat(mut self, stat: &str, value: f64) -> Self {
        self.player_stats.insert(stat.to_string(), value);
        self
    }

    pub fn with_custom_var(mut self, name: &str, value: f64) -> Self {
        self.custom_vars.insert(name.to_string(), value);
        self
    }

    pub fn with_known_spell(mut self, spell_id: u32) -> Self {
        self.known_spells.insert(spell_id);
        self
    }

    pub fn with_active_aura(mut self, aura_id: u32) -> Self {
        self.active_auras.insert(aura_id);
        self
    }

    pub fn with_class(mut self, class_id: u32) -> Self {
        self.player_class = Some(class_id);
        self
    }

    pub fn with_gender(mut self, is_male: bool) -> Self {
        self.is_male = is_male;
        self
    }

    pub fn with_spell_name(mut self, spell_id: u32, name: &str) -> Self {
        self.spell_names.insert(spell_id, name.to_string());
        self
    }

    pub fn with_spell_description(mut self, spell_id: u32, description: &str) -> Self {
        self.spell_descriptions
            .insert(spell_id, description.to_string());
        self
    }
}

impl SpellDescResolver for TestResolver {
    fn get_effect_value(&self, spell_id: u32, effect_index: u8, var_type: &str) -> Option<f64> {
        self.effects
            .get(&(spell_id, effect_index, var_type.to_string()))
            .copied()
    }

    fn get_spell_value(&self, spell_id: u32, var_type: &str) -> Option<String> {
        self.spell_values
            .get(&(spell_id, var_type.to_string()))
            .cloned()
    }

    fn get_player_stat(&self, stat: &str) -> Option<f64> {
        self.player_stats.get(stat).copied()
    }

    fn get_custom_var(&self, name: &str) -> Option<f64> {
        self.custom_vars.get(name).copied()
    }

    fn knows_spell(&self, spell_id: u32) -> bool {
        self.known_spells.contains(&spell_id)
    }

    fn has_aura(&self, aura_id: u32) -> bool {
        self.active_auras.contains(&aura_id)
    }

    fn is_class(&self, class_id: u32) -> bool {
        self.player_class == Some(class_id)
    }

    fn is_male(&self) -> bool {
        self.is_male
    }

    fn get_spell_description(&self, spell_id: u32) -> Option<String> {
        self.spell_descriptions.get(&spell_id).cloned()
    }

    fn get_spell_name(&self, spell_id: u32) -> Option<String> {
        self.spell_names.get(&spell_id).cloned()
    }

    fn get_spell_icon(&self, _spell_id: u32) -> Option<String> {
        None
    }
}
