//! JSON-based rotation DSL from react-query-builder.
//!
//! This module parses rotation definitions exported from the web editor's
//! query builder component and evaluates them against simulation state.
//!
//! # Example JSON
//!
//! ```json
//! {
//!   "defaultListId": "uuid-1",
//!   "lists": [
//!     {
//!       "id": "uuid-1",
//!       "name": "default",
//!       "listType": "main",
//!       "actions": [
//!         {
//!           "type": "spell",
//!           "spellId": 34026,
//!           "condition": {
//!             "combinator": "and",
//!             "rules": [
//!               { "field": "cooldown.kill_command.ready", "operator": "=", "value": "true" }
//!             ]
//!           }
//!         }
//!       ]
//!     }
//!   ]
//! }
//! ```

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use super::Action;
use crate::sim::SimState;
use crate::types::{AuraIdx, SpellIdx};

// ============================================================================
// JSON DSL Types
// ============================================================================

/// Root rotation definition.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RotationDef {
    /// ID of the default/main action list to start execution from.
    pub default_list_id: String,
    /// Optional name for this rotation.
    #[serde(default)]
    pub name: String,
    /// Optional description.
    #[serde(default)]
    pub description: String,
    /// All action lists in this rotation.
    pub lists: Vec<ActionList>,
    /// User-defined variables (for future use).
    #[serde(default)]
    pub variables: Vec<Variable>,
}

/// An action list containing a sequence of actions.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ActionList {
    /// Unique identifier for this list.
    pub id: String,
    /// Human-readable name.
    #[serde(default)]
    pub name: String,
    /// Display label.
    #[serde(default)]
    pub label: String,
    /// Type of list: "main" or "sub".
    #[serde(default)]
    pub list_type: ListType,
    /// Actions in this list.
    #[serde(default)]
    pub actions: Vec<ActionDef>,
}

/// Type of action list.
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ListType {
    #[default]
    Main,
    Sub,
}

/// A single action in an action list.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ActionDef {
    /// Unique ID for this action.
    pub id: String,
    /// Whether this action is enabled.
    #[serde(default = "default_true")]
    pub enabled: bool,
    /// The action type and data.
    #[serde(flatten)]
    pub action_type: ActionType,
    /// Condition that must be met for this action to execute.
    #[serde(default)]
    pub condition: Option<Condition>,
}

fn default_true() -> bool {
    true
}

/// The type-specific data for an action.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ActionType {
    /// Cast a spell by ID.
    Spell {
        #[serde(rename = "spellId")]
        spell_id: u32,
    },
    /// Call another action list.
    CallActionList {
        #[serde(rename = "listId")]
        list_id: String,
    },
    /// Wait for a duration.
    Wait {
        /// Duration in seconds.
        duration: f64,
    },
    /// Wait for GCD.
    WaitGcd,
}

/// User-defined variable (for future use).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Variable {
    pub name: String,
    pub value: String,
}

// ============================================================================
// Condition Types (react-query-builder format)
// ============================================================================

/// A condition group with combinator.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Condition {
    /// Unique ID for this condition group.
    #[serde(default)]
    pub id: String,
    /// How to combine rules: "and" or "or".
    #[serde(default)]
    pub combinator: Combinator,
    /// Whether to negate the entire group.
    #[serde(default)]
    pub not: bool,
    /// Rules in this group (can be conditions or rule items).
    #[serde(default)]
    pub rules: Vec<Rule>,
}

/// How to combine rules in a condition group.
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Combinator {
    #[default]
    And,
    Or,
}

/// A rule can be either a leaf rule or a nested condition group.
/// Note: Leaf must come first because with untagged, serde tries variants in order,
/// and Condition has all default fields so it would match any object.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum Rule {
    /// A leaf rule comparing a field to a value.
    Leaf(RuleLeaf),
    /// A nested condition group.
    Group(Condition),
}

/// A leaf rule that compares a field to a value.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RuleLeaf {
    /// Unique ID for this rule.
    #[serde(default)]
    pub id: String,
    /// The field path to evaluate (e.g., "target.health.pct", "cooldown.kill_command.ready").
    pub field: String,
    /// The comparison operator.
    pub operator: Operator,
    /// The value to compare against.
    pub value: String,
    /// Source of the value (usually "value" for literal values).
    #[serde(default)]
    pub value_source: ValueSource,
}

/// Comparison operators.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum Operator {
    #[serde(rename = "=")]
    Eq,
    #[serde(rename = "!=")]
    Ne,
    #[serde(rename = "<")]
    Lt,
    #[serde(rename = "<=")]
    Le,
    #[serde(rename = ">")]
    Gt,
    #[serde(rename = ">=")]
    Ge,
    #[serde(rename = "contains")]
    Contains,
    #[serde(rename = "beginsWith")]
    BeginsWith,
    #[serde(rename = "endsWith")]
    EndsWith,
}

/// Source of the comparison value.
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum ValueSource {
    #[default]
    Value,
    Field,
}

// ============================================================================
// Evaluation Context
// ============================================================================

/// Trait for resolving spell IDs to internal indices.
pub trait SpellResolver {
    fn resolve_spell(&self, spell_id: u32) -> Option<SpellIdx>;
    fn resolve_aura(&self, name: &str) -> Option<AuraIdx>;
    fn spell_name(&self, idx: SpellIdx) -> Option<&str>;
}

/// Evaluated field value.
#[derive(Debug, Clone)]
pub enum FieldValue {
    Bool(bool),
    Number(f64),
    String(String),
}

impl FieldValue {
    fn as_bool(&self) -> bool {
        match self {
            FieldValue::Bool(b) => *b,
            FieldValue::Number(n) => *n != 0.0,
            FieldValue::String(s) => !s.is_empty() && s != "false" && s != "0",
        }
    }

    fn as_number(&self) -> f64 {
        match self {
            FieldValue::Bool(b) => if *b { 1.0 } else { 0.0 },
            FieldValue::Number(n) => *n,
            FieldValue::String(s) => s.parse().unwrap_or(0.0),
        }
    }
}

// ============================================================================
// JSON Rotation Executor
// ============================================================================

/// Compiled JSON rotation ready for execution.
pub struct JsonRotation<R: SpellResolver> {
    /// The parsed rotation definition.
    def: RotationDef,
    /// Map from list ID to index in def.lists.
    list_index: HashMap<String, usize>,
    /// Spell resolver for converting IDs.
    resolver: R,
}

impl<R: SpellResolver> JsonRotation<R> {
    /// Parse and compile a rotation from JSON.
    pub fn from_json(json: &str, resolver: R) -> Result<Self, serde_json::Error> {
        let def: RotationDef = serde_json::from_str(json)?;
        Self::new(def, resolver)
    }

    /// Create from a parsed definition.
    pub fn new(def: RotationDef, resolver: R) -> Result<Self, serde_json::Error> {
        let list_index: HashMap<String, usize> = def
            .lists
            .iter()
            .enumerate()
            .map(|(i, list)| (list.id.clone(), i))
            .collect();

        Ok(Self {
            def,
            list_index,
            resolver,
        })
    }

    /// Get the next action to perform given current simulation state.
    pub fn next_action(&self, state: &SimState) -> Action {
        self.evaluate_list(&self.def.default_list_id, state, 0)
            .unwrap_or(Action::WaitGcd)
    }

    /// Evaluate an action list and return the first matching action.
    fn evaluate_list(&self, list_id: &str, state: &SimState, depth: u32) -> Option<Action> {
        // Prevent infinite recursion
        if depth > 10 {
            tracing::warn!(list_id, "Max call depth exceeded in rotation");
            return None;
        }

        let list_idx = self.list_index.get(list_id)?;
        let list = self.def.lists.get(*list_idx)?;

        for action_def in &list.actions {
            if !action_def.enabled {
                continue;
            }

            // Check condition
            if let Some(ref condition) = action_def.condition {
                if !self.evaluate_condition(condition, state) {
                    continue;
                }
            }

            // Execute action
            match &action_def.action_type {
                ActionType::Spell { spell_id } => {
                    // Check if spell is castable
                    if let Some(spell_idx) = self.resolver.resolve_spell(*spell_id) {
                        if self.is_spell_ready(spell_idx, state) {
                            if let Some(name) = self.resolver.spell_name(spell_idx) {
                                return Some(Action::Cast(name.to_string()));
                            }
                        }
                    }
                }
                ActionType::CallActionList { list_id } => {
                    if let Some(action) = self.evaluate_list(list_id, state, depth + 1) {
                        return Some(action);
                    }
                    // If sub-list returns nothing, continue to next action
                }
                ActionType::Wait { duration } => {
                    return Some(Action::Wait(*duration));
                }
                ActionType::WaitGcd => {
                    return Some(Action::WaitGcd);
                }
            }
        }

        None
    }

    /// Check if a spell is ready to cast.
    fn is_spell_ready(&self, spell: SpellIdx, state: &SimState) -> bool {
        let now = state.now();

        // Check cooldown
        if let Some(cd) = state.player.cooldown(spell) {
            if !cd.is_ready(now) {
                return false;
            }
        }

        // Check charged cooldown
        if let Some(cd) = state.player.charged_cooldown(spell) {
            if !cd.has_charge() {
                return false;
            }
        }

        // Check GCD
        if !state.player.can_cast(now) {
            return false;
        }

        true
    }

    /// Evaluate a condition against simulation state.
    fn evaluate_condition(&self, condition: &Condition, state: &SimState) -> bool {
        if condition.rules.is_empty() {
            // Empty rules = always true
            return !condition.not;
        }

        let result = match condition.combinator {
            Combinator::And => condition.rules.iter().all(|r| self.evaluate_rule(r, state)),
            Combinator::Or => condition.rules.iter().any(|r| self.evaluate_rule(r, state)),
        };

        if condition.not {
            !result
        } else {
            result
        }
    }

    /// Evaluate a single rule.
    fn evaluate_rule(&self, rule: &Rule, state: &SimState) -> bool {
        match rule {
            Rule::Group(condition) => self.evaluate_condition(condition, state),
            Rule::Leaf(leaf) => self.evaluate_leaf(leaf, state),
        }
    }

    /// Evaluate a leaf rule by comparing field value to target value.
    fn evaluate_leaf(&self, leaf: &RuleLeaf, state: &SimState) -> bool {
        let field_value = self.get_field_value(&leaf.field, state);
        let target_value = self.parse_value(&leaf.value);

        self.compare(&field_value, &leaf.operator, &target_value)
    }

    /// Get the value of a field from simulation state.
    fn get_field_value(&self, field: &str, state: &SimState) -> FieldValue {
        let now = state.now();
        let parts: Vec<&str> = field.split('.').collect();

        match parts.as_slice() {
            // Target fields
            ["target", "health", "pct"] => {
                let pct = state
                    .enemies
                    .primary()
                    .map(|e| e.health_percent() * 100.0)
                    .unwrap_or(100.0);
                FieldValue::Number(pct as f64)
            }
            ["target", "health", "current"] => {
                let health = state
                    .enemies
                    .primary()
                    .map(|e| e.current_health)
                    .unwrap_or(0.0);
                FieldValue::Number(health as f64)
            }
            ["target", "health", "max"] => {
                let health = state
                    .enemies
                    .primary()
                    .map(|e| e.max_health)
                    .unwrap_or(0.0);
                FieldValue::Number(health as f64)
            }
            ["target", "distance"] => {
                // TODO: Track actual distance
                FieldValue::Number(state.config.initial_distance as f64)
            }
            ["target", "count"] | ["enemies", "count"] => {
                FieldValue::Number(state.enemies.alive_count() as f64)
            }

            // Player resource fields
            ["resource", "current"] | ["focus", "current"] | ["power", "current"] => {
                let resource = state
                    .player
                    .resources
                    .primary
                    .as_ref()
                    .map(|r| r.current)
                    .unwrap_or(0.0);
                FieldValue::Number(resource as f64)
            }
            ["resource", "max"] | ["focus", "max"] | ["power", "max"] => {
                let resource = state
                    .player
                    .resources
                    .primary
                    .as_ref()
                    .map(|r| r.max)
                    .unwrap_or(0.0);
                FieldValue::Number(resource as f64)
            }
            ["resource", "pct"] | ["focus", "pct"] | ["power", "pct"] => {
                let pct = state
                    .player
                    .resources
                    .primary
                    .as_ref()
                    .map(|r| (r.current / r.max) * 100.0)
                    .unwrap_or(0.0);
                FieldValue::Number(pct as f64)
            }
            ["resource", "deficit"] | ["focus", "deficit"] | ["power", "deficit"] => {
                let deficit = state
                    .player
                    .resources
                    .primary
                    .as_ref()
                    .map(|r| r.deficit())
                    .unwrap_or(0.0);
                FieldValue::Number(deficit as f64)
            }

            // Cooldown fields
            ["cooldown", spell_name, "ready"] => {
                let ready = self
                    .resolver
                    .resolve_spell(self.parse_spell_ref(spell_name))
                    .map(|idx| {
                        state
                            .player
                            .cooldown(idx)
                            .map(|cd| cd.is_ready(now))
                            .unwrap_or(true)
                    })
                    .unwrap_or(false);
                FieldValue::Bool(ready)
            }
            ["cooldown", spell_name, "remaining"] => {
                let remaining = self
                    .resolver
                    .resolve_spell(self.parse_spell_ref(spell_name))
                    .and_then(|idx| state.player.cooldown(idx))
                    .map(|cd| cd.remaining(now).as_secs_f32())
                    .unwrap_or(0.0);
                FieldValue::Number(remaining as f64)
            }
            ["cooldown", spell_name, "charges"] => {
                let charges = self
                    .resolver
                    .resolve_spell(self.parse_spell_ref(spell_name))
                    .and_then(|idx| state.player.charged_cooldown(idx))
                    .map(|cd| cd.current_charges)
                    .unwrap_or(0);
                FieldValue::Number(charges as f64)
            }

            // Buff/aura fields
            ["buff", aura_name, "active"] | ["aura", aura_name, "active"] => {
                let active = self
                    .resolver
                    .resolve_aura(aura_name)
                    .map(|idx| state.player.buffs.has(idx, now))
                    .unwrap_or(false);
                FieldValue::Bool(active)
            }
            ["buff", aura_name, "stacks"] | ["aura", aura_name, "stacks"] => {
                let stacks = self
                    .resolver
                    .resolve_aura(aura_name)
                    .map(|idx| state.player.buffs.stacks(idx, now))
                    .unwrap_or(0);
                FieldValue::Number(stacks as f64)
            }
            ["buff", aura_name, "remaining"] | ["aura", aura_name, "remaining"] => {
                let remaining = self
                    .resolver
                    .resolve_aura(aura_name)
                    .and_then(|idx| state.player.buffs.get(idx))
                    .map(|a| a.remaining(now).as_secs_f32())
                    .unwrap_or(0.0);
                FieldValue::Number(remaining as f64)
            }

            // Fight context
            ["fight", "duration"] => FieldValue::Number(state.config.duration.as_secs_f32() as f64),
            ["fight", "remaining"] => FieldValue::Number(state.remaining().as_secs_f32() as f64),
            ["fight", "elapsed"] => FieldValue::Number(state.now().as_secs_f32() as f64),
            ["fight", "progress"] => FieldValue::Number((state.progress() * 100.0) as f64),

            // Player stats
            ["player", "haste"] => FieldValue::Number(state.player.stats.haste() as f64),
            ["player", "crit"] => {
                FieldValue::Number((state.player.stats.crit_chance() * 100.0) as f64)
            }
            ["player", "mastery"] => {
                FieldValue::Number((state.player.stats.mastery() * 100.0) as f64)
            }
            ["player", "versatility"] => {
                FieldValue::Number((state.player.stats.versatility() * 100.0) as f64)
            }

            // Pet count
            ["pet", "count"] => FieldValue::Number(state.pets.active_count(now) as f64),

            // Unknown field
            _ => {
                tracing::warn!(field, "Unknown field in rotation condition");
                FieldValue::Bool(false)
            }
        }
    }

    /// Parse a spell reference (could be ID or name).
    fn parse_spell_ref(&self, spell_ref: &str) -> u32 {
        spell_ref.parse().unwrap_or(0)
    }

    /// Parse a string value into a FieldValue.
    fn parse_value(&self, value: &str) -> FieldValue {
        if value == "true" {
            FieldValue::Bool(true)
        } else if value == "false" {
            FieldValue::Bool(false)
        } else if let Ok(n) = value.parse::<f64>() {
            FieldValue::Number(n)
        } else {
            FieldValue::String(value.to_string())
        }
    }

    /// Compare two values using an operator.
    fn compare(&self, left: &FieldValue, op: &Operator, right: &FieldValue) -> bool {
        match op {
            Operator::Eq => {
                // For booleans, compare as bool
                if matches!(left, FieldValue::Bool(_)) || matches!(right, FieldValue::Bool(_)) {
                    left.as_bool() == right.as_bool()
                } else {
                    (left.as_number() - right.as_number()).abs() < f64::EPSILON
                }
            }
            Operator::Ne => !self.compare(left, &Operator::Eq, right),
            Operator::Lt => left.as_number() < right.as_number(),
            Operator::Le => left.as_number() <= right.as_number(),
            Operator::Gt => left.as_number() > right.as_number(),
            Operator::Ge => left.as_number() >= right.as_number(),
            Operator::Contains => {
                if let (FieldValue::String(l), FieldValue::String(r)) = (left, right) {
                    l.contains(r)
                } else {
                    false
                }
            }
            Operator::BeginsWith => {
                if let (FieldValue::String(l), FieldValue::String(r)) = (left, right) {
                    l.starts_with(r)
                } else {
                    false
                }
            }
            Operator::EndsWith => {
                if let (FieldValue::String(l), FieldValue::String(r)) = (left, right) {
                    l.ends_with(r)
                } else {
                    false
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_rotation() {
        let json = r#"{
            "defaultListId": "main",
            "name": "Test Rotation",
            "lists": [
                {
                    "id": "main",
                    "name": "default",
                    "listType": "main",
                    "actions": [
                        {
                            "id": "1",
                            "type": "spell",
                            "spellId": 34026,
                            "enabled": true,
                            "condition": {
                                "combinator": "and",
                                "rules": [
                                    {
                                        "field": "cooldown.kill_command.ready",
                                        "operator": "=",
                                        "value": "true"
                                    }
                                ]
                            }
                        }
                    ]
                }
            ],
            "variables": []
        }"#;

        let def: RotationDef = serde_json::from_str(json).unwrap();
        assert_eq!(def.name, "Test Rotation");
        assert_eq!(def.lists.len(), 1);
        assert_eq!(def.lists[0].actions.len(), 1);

        if let ActionType::Spell { spell_id } = &def.lists[0].actions[0].action_type {
            assert_eq!(*spell_id, 34026);
        } else {
            panic!("Expected spell action");
        }
    }

    #[test]
    fn test_parse_nested_conditions() {
        let json = r#"{
            "combinator": "and",
            "rules": [
                {
                    "combinator": "or",
                    "rules": [
                        { "field": "target.health.pct", "operator": "<=", "value": "20" },
                        { "field": "buff.kill_shot.active", "operator": "=", "value": "true" }
                    ]
                },
                { "field": "cooldown.kill_shot.ready", "operator": "=", "value": "true" }
            ]
        }"#;

        let condition: Condition = serde_json::from_str(json).unwrap();
        assert_eq!(condition.combinator, Combinator::And);
        assert_eq!(condition.rules.len(), 2);
    }
}
