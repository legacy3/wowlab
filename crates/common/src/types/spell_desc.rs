//! Types for spell description analysis and rendering.
//!
//! These types are used by the spell description parser to communicate
//! data dependencies to the caller (Portal/TypeScript), enabling efficient
//! data fetching and live tooltip updates.

use serde::{Deserialize, Serialize};

#[cfg(feature = "wasm")]
use tsify_next::Tsify;

// Dependencies

/// Dependencies extracted from a spell description.
///
/// Returned by `analyzeSpellDesc()` to tell the caller what data to fetch
/// before rendering the description.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi))]
#[serde(rename_all = "camelCase")]
pub struct SpellDescDependencies {
    /// All spell IDs needed (self + cross-references).
    pub spell_ids: Vec<u32>,

    /// Effect indices needed per spell: (spell_id, effect_index, var_type).
    pub effects: Vec<EffectDependency>,

    /// Spell-level values needed: (spell_id, var_type like "d", "n", "r").
    pub spell_values: Vec<SpellValueDependency>,

    /// Player stats needed: "SP", "AP", "haste", etc.
    pub player_stats: Vec<String>,

    /// Custom variables needed (from spell's description_variables).
    pub custom_vars: Vec<String>,

    /// Spell IDs for "spell known" conditionals.
    pub spell_known_checks: Vec<u32>,

    /// Aura IDs for "aura active" conditionals.
    pub aura_checks: Vec<u32>,

    /// Class IDs for class conditionals.
    pub class_checks: Vec<u32>,

    /// Whether gender is needed for $g tokens.
    pub needs_gender: bool,

    /// Spell IDs for @spelldesc recursive embedding.
    pub embedded_spell_ids: Vec<u32>,
}

impl SpellDescDependencies {
    /// Create a new empty dependencies struct.
    pub fn new() -> Self {
        Self::default()
    }

    /// Add a spell ID to the dependency list if not already present.
    pub fn add_spell_id(&mut self, spell_id: u32) {
        if !self.spell_ids.contains(&spell_id) {
            self.spell_ids.push(spell_id);
        }
    }

    /// Add an effect dependency.
    pub fn add_effect(&mut self, spell_id: u32, effect_index: u8, var_type: String) {
        self.add_spell_id(spell_id);
        let dep = EffectDependency {
            spell_id,
            effect_index,
            var_type,
        };
        if !self.effects.contains(&dep) {
            self.effects.push(dep);
        }
    }

    /// Add a spell value dependency.
    pub fn add_spell_value(&mut self, spell_id: u32, var_type: String) {
        self.add_spell_id(spell_id);
        let dep = SpellValueDependency { spell_id, var_type };
        if !self.spell_values.contains(&dep) {
            self.spell_values.push(dep);
        }
    }

    /// Add a player stat dependency.
    pub fn add_player_stat(&mut self, stat: String) {
        if !self.player_stats.contains(&stat) {
            self.player_stats.push(stat);
        }
    }

    /// Add a custom variable dependency.
    pub fn add_custom_var(&mut self, name: String) {
        if !self.custom_vars.contains(&name) {
            self.custom_vars.push(name);
        }
    }

    /// Add a spell known check.
    pub fn add_spell_known_check(&mut self, spell_id: u32) {
        if !self.spell_known_checks.contains(&spell_id) {
            self.spell_known_checks.push(spell_id);
        }
    }

    /// Add an aura check.
    pub fn add_aura_check(&mut self, aura_id: u32) {
        if !self.aura_checks.contains(&aura_id) {
            self.aura_checks.push(aura_id);
        }
    }

    /// Add a class check.
    pub fn add_class_check(&mut self, class_id: u32) {
        if !self.class_checks.contains(&class_id) {
            self.class_checks.push(class_id);
        }
    }

    /// Add an embedded spell ID.
    pub fn add_embedded_spell(&mut self, spell_id: u32) {
        self.add_spell_id(spell_id);
        if !self.embedded_spell_ids.contains(&spell_id) {
            self.embedded_spell_ids.push(spell_id);
        }
    }

    /// Merge another dependencies struct into this one.
    pub fn merge(&mut self, other: &SpellDescDependencies) {
        for id in &other.spell_ids {
            self.add_spell_id(*id);
        }
        for dep in &other.effects {
            self.add_effect(dep.spell_id, dep.effect_index, dep.var_type.clone());
        }
        for dep in &other.spell_values {
            self.add_spell_value(dep.spell_id, dep.var_type.clone());
        }
        for stat in &other.player_stats {
            self.add_player_stat(stat.clone());
        }
        for var in &other.custom_vars {
            self.add_custom_var(var.clone());
        }
        for id in &other.spell_known_checks {
            self.add_spell_known_check(*id);
        }
        for id in &other.aura_checks {
            self.add_aura_check(*id);
        }
        for id in &other.class_checks {
            self.add_class_check(*id);
        }
        if other.needs_gender {
            self.needs_gender = true;
        }
        for id in &other.embedded_spell_ids {
            self.add_embedded_spell(*id);
        }
    }
}

/// An effect value dependency.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[serde(rename_all = "camelCase")]
pub struct EffectDependency {
    /// The spell ID this effect belongs to.
    pub spell_id: u32,
    /// The 1-indexed effect index.
    pub effect_index: u8,
    /// The variable type: "s" (base), "m" (min), "M" (max), "t" (period), "a" (radius), "x" (chain targets), etc.
    pub var_type: String,
}

/// A spell-level value dependency.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[serde(rename_all = "camelCase")]
pub struct SpellValueDependency {
    /// The spell ID.
    pub spell_id: u32,
    /// The variable type: "d" (duration), "n" (charges), "r" (range), "h" (proc chance), etc.
    pub var_type: String,
}

// Render Result

/// A single fragment of rendered spell description.
/// React uses these to render with proper styling without dangerouslySetInnerHTML.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum SpellDescFragment {
    /// Plain text content.
    Text { value: String },
    /// A resolved numeric value (for highlighting).
    Value { value: String, raw: f64 },
    /// A formatted duration value.
    Duration { value: String, raw_ms: f64 },
    /// A color code start (|cAARRGGBB).
    ColorStart { color: String },
    /// A color code end (|r).
    ColorEnd,
    /// A spell icon reference.
    Icon { spell_id: u32, path: String },
    /// A spell name (potentially linkable).
    SpellName { spell_id: u32, name: String },
    /// Embedded spell description fragments.
    Embedded {
        spell_id: u32,
        fragments: Vec<SpellDescFragment>,
    },
    /// Unresolved variable (shown as original token).
    Unresolved { token: String },
    /// Raw token for debug display (variable/expression shown without resolving).
    RawToken { value: String },
}

/// Result of rendering a spell description.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi))]
#[serde(rename_all = "camelCase")]
pub struct SpellDescRenderResult {
    /// The rendered fragments.
    pub fragments: Vec<SpellDescFragment>,
    /// Parse errors (from the parser).
    pub parse_errors: Vec<String>,
    /// Render warnings (unresolved variables, etc.).
    pub warnings: Vec<String>,
}

impl SpellDescRenderResult {
    /// Create a new empty result.
    pub fn new() -> Self {
        Self::default()
    }

    /// Create a result with fragments.
    pub fn with_fragments(fragments: Vec<SpellDescFragment>) -> Self {
        Self {
            fragments,
            parse_errors: Vec::new(),
            warnings: Vec::new(),
        }
    }

    /// Add a parse error.
    pub fn add_parse_error(&mut self, error: String) {
        self.parse_errors.push(error);
    }

    /// Add a warning.
    pub fn add_warning(&mut self, warning: String) {
        self.warnings.push(warning);
    }

    /// Check if there are any errors.
    pub fn has_errors(&self) -> bool {
        !self.parse_errors.is_empty()
    }

    /// Convert fragments to plain text (for backwards compatibility or simple display).
    pub fn to_plain_text(&self) -> String {
        self.fragments
            .iter()
            .map(|f| match f {
                SpellDescFragment::Text { value } => value.clone(),
                SpellDescFragment::Value { value, .. } => value.clone(),
                SpellDescFragment::Duration { value, .. } => value.clone(),
                SpellDescFragment::ColorStart { .. } => String::new(),
                SpellDescFragment::ColorEnd => String::new(),
                SpellDescFragment::Icon { .. } => String::new(),
                SpellDescFragment::SpellName { name, .. } => name.clone(),
                SpellDescFragment::Embedded { fragments, .. } => {
                    SpellDescRenderResult::with_fragments(fragments.clone()).to_plain_text()
                }
                SpellDescFragment::Unresolved { token } => token.clone(),
                SpellDescFragment::RawToken { value } => value.clone(),
            })
            .collect()
    }
}
