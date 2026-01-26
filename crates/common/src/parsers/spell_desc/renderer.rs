//! Renderer for spell descriptions.
//!
//! Walks the parsed AST and produces structured fragments by resolving
//! all variables, evaluating expressions, and handling conditionals.

use super::resolver::SpellDescResolver;
use super::types::*;
use crate::types::spell_desc::{SpellDescFragment, SpellDescRenderResult};

/// Maximum recursion depth for @spelldesc embedding.
const MAX_EMBED_DEPTH: u8 = 3;

/// Epsilon for float comparisons.
const FLOAT_EPSILON: f64 = 0.001;

/// Render a parsed spell description to structured fragments.
///
/// # Arguments
/// * `ast` - The parsed spell description AST
/// * `self_spell_id` - The spell ID being rendered
/// * `resolver` - The resolver providing variable values
/// * `parse_errors` - Any errors from parsing
///
/// # Returns
/// The rendered result with fragments and any warnings.
pub fn render_with_resolver<R: SpellDescResolver>(
    ast: &ParsedSpellDescription,
    self_spell_id: u32,
    resolver: &R,
    parse_errors: Vec<String>,
) -> SpellDescRenderResult {
    let mut ctx = RenderContext::new(self_spell_id, resolver);
    let fragments = ctx.render_nodes(&ast.nodes);
    let warnings = ctx.warnings;

    SpellDescRenderResult {
        fragments,
        parse_errors,
        warnings,
    }
}

/// Render context holding state during rendering.
struct RenderContext<'a, R: SpellDescResolver> {
    self_spell_id: u32,
    resolver: &'a R,
    /// The last numeric value rendered (for pluralization).
    last_number: Option<f64>,
    /// Current embed depth (for recursive @spelldesc).
    embed_depth: u8,
    /// Warnings accumulated during rendering.
    warnings: Vec<String>,
}

impl<'a, R: SpellDescResolver> RenderContext<'a, R> {
    fn new(self_spell_id: u32, resolver: &'a R) -> Self {
        Self {
            self_spell_id,
            resolver,
            last_number: None,
            embed_depth: 0,
            warnings: Vec::new(),
        }
    }

    fn render_nodes(&mut self, nodes: &[SpellDescriptionNode]) -> Vec<SpellDescFragment> {
        let mut fragments = Vec::new();
        for node in nodes {
            fragments.extend(self.render_node(node));
        }
        // Merge adjacent text fragments
        merge_text_fragments(&mut fragments);
        fragments
    }

    fn render_node(&mut self, node: &SpellDescriptionNode) -> Vec<SpellDescFragment> {
        match node {
            SpellDescriptionNode::Text(text) => {
                vec![SpellDescFragment::Text {
                    value: text.value.clone(),
                }]
            }

            SpellDescriptionNode::ColorCode(color) => {
                if color.code == "r" {
                    vec![SpellDescFragment::ColorEnd]
                } else {
                    vec![SpellDescFragment::ColorStart {
                        color: color.code.clone(),
                    }]
                }
            }

            SpellDescriptionNode::Variable(var) => self.render_variable(var),

            SpellDescriptionNode::ExpressionBlock(block) => {
                let value = self.evaluate_expression(&block.expression);
                self.last_number = Some(value);
                vec![SpellDescFragment::Value {
                    value: self.format_number(value, block.decimal_places),
                    raw: value,
                }]
            }

            SpellDescriptionNode::Conditional(cond) => self.render_conditional(cond),

            SpellDescriptionNode::Pluralization(plural) => self.render_pluralization(plural),

            SpellDescriptionNode::Gender(gender) => self.render_gender(gender),
        }
    }

    fn render_variable(&mut self, var: &VariableNode) -> Vec<SpellDescFragment> {
        match var {
            VariableNode::Effect(effect) => {
                if let Some(value) = self.resolver.get_effect_value(
                    self.self_spell_id,
                    effect.effect_index,
                    &effect.var_type,
                ) {
                    self.last_number = Some(value);
                    vec![SpellDescFragment::Value {
                        value: self.format_effect_value(value, &effect.var_type),
                        raw: value,
                    }]
                } else {
                    let token = format!("${}{}", effect.var_type, effect.effect_index);
                    self.warnings
                        .push(format!("Unresolved effect variable: {}", token));
                    vec![SpellDescFragment::Unresolved { token }]
                }
            }

            VariableNode::SpellLevel(spell_level) => {
                let key = build_spell_level_key(&spell_level.var_type, spell_level.index);
                if let Some(value) = self.resolver.get_spell_value(self.self_spell_id, &key) {
                    // Try to extract number for pluralization
                    if let Ok(num) = value.split_whitespace().next().unwrap_or("").parse::<f64>() {
                        self.last_number = Some(num);
                    }
                    // Check if this looks like a duration
                    if spell_level.var_type == "d" {
                        if let Some(raw_ms) = parse_duration_ms(&value) {
                            return vec![SpellDescFragment::Duration { value, raw_ms }];
                        }
                    }
                    vec![SpellDescFragment::Text { value }]
                } else {
                    let token = format!("${}", key);
                    self.warnings
                        .push(format!("Unresolved spell-level variable: {}", token));
                    vec![SpellDescFragment::Unresolved { token }]
                }
            }

            VariableNode::Player(player) => {
                if let Some(value) = self.resolver.get_player_stat(&player.var_name) {
                    self.last_number = Some(value);
                    vec![SpellDescFragment::Value {
                        value: self.format_number(value, None),
                        raw: value,
                    }]
                } else {
                    let token = format!("${}", player.var_name);
                    self.warnings
                        .push(format!("Unresolved player stat: {}", token));
                    vec![SpellDescFragment::Unresolved { token }]
                }
            }

            VariableNode::CrossSpell(cross) => {
                if let Some(idx) = cross.effect_index {
                    if let Some(value) =
                        self.resolver
                            .get_effect_value(cross.spell_id, idx, &cross.var_type)
                    {
                        self.last_number = Some(value);
                        vec![SpellDescFragment::Value {
                            value: self.format_effect_value(value, &cross.var_type),
                            raw: value,
                        }]
                    } else {
                        let token = format!("${}{}{}", cross.spell_id, cross.var_type, idx);
                        self.warnings
                            .push(format!("Unresolved cross-spell effect: {}", token));
                        vec![SpellDescFragment::Unresolved { token }]
                    }
                } else if let Some(value) =
                    self.resolver.get_spell_value(cross.spell_id, &cross.var_type)
                {
                    vec![SpellDescFragment::Text { value }]
                } else {
                    let token = format!("${}{}", cross.spell_id, cross.var_type);
                    self.warnings
                        .push(format!("Unresolved cross-spell value: {}", token));
                    vec![SpellDescFragment::Unresolved { token }]
                }
            }

            VariableNode::Custom(custom) => {
                if let Some(value) = self.resolver.get_custom_var(&custom.var_name) {
                    self.last_number = Some(value);
                    vec![SpellDescFragment::Value {
                        value: self.format_number(value, None),
                        raw: value,
                    }]
                } else {
                    let token = format!("$<{}>", custom.var_name);
                    self.warnings
                        .push(format!("Unresolved custom variable: {}", token));
                    vec![SpellDescFragment::Unresolved { token }]
                }
            }

            VariableNode::At(at) => self.render_at_variable(at),

            VariableNode::Enchant(enchant) => {
                // Try spell values first, then player stats
                if let Some(value) = self
                    .resolver
                    .get_spell_value(self.self_spell_id, &enchant.var_type)
                {
                    vec![SpellDescFragment::Text { value }]
                } else if let Some(value) = self.resolver.get_player_stat(&enchant.var_type) {
                    self.last_number = Some(value);
                    vec![SpellDescFragment::Value {
                        value: self.format_number(value, None),
                        raw: value,
                    }]
                } else {
                    let token = format!("${}", enchant.var_type);
                    self.warnings
                        .push(format!("Unresolved enchant variable: {}", token));
                    vec![SpellDescFragment::Unresolved { token }]
                }
            }

            VariableNode::Misc(misc) => {
                let key = build_misc_key(&misc.var_name, misc.id);
                // Try spell values first, then player stats
                if let Some(value) = self.resolver.get_spell_value(self.self_spell_id, &key) {
                    vec![SpellDescFragment::Text { value }]
                } else if let Some(value) = self.resolver.get_player_stat(&key) {
                    self.last_number = Some(value);
                    vec![SpellDescFragment::Value {
                        value: self.format_number(value, None),
                        raw: value,
                    }]
                } else {
                    let token = format!("${}", key);
                    self.warnings
                        .push(format!("Unresolved misc variable: {}", token));
                    vec![SpellDescFragment::Unresolved { token }]
                }
            }
        }
    }

    fn render_at_variable(&mut self, at: &AtVariableNode) -> Vec<SpellDescFragment> {
        match at.var_type.as_str() {
            "spelldesc" => {
                if self.embed_depth >= MAX_EMBED_DEPTH {
                    self.warnings.push(format!(
                        "Max embed depth ({}) exceeded for @spelldesc",
                        MAX_EMBED_DEPTH
                    ));
                    return vec![SpellDescFragment::Text {
                        value: "[...]".to_string(),
                    }];
                }
                if let Some(spell_id) = at.spell_id {
                    if let Some(desc) = self.resolver.get_spell_description(spell_id) {
                        // Recursively parse and render the embedded description
                        use super::parser::parse;
                        let saved_spell_id = self.self_spell_id;
                        self.self_spell_id = spell_id;
                        self.embed_depth += 1;
                        let parsed = parse(&desc);
                        let fragments = self.render_nodes(&parsed.ast.nodes);
                        self.embed_depth -= 1;
                        self.self_spell_id = saved_spell_id;
                        vec![SpellDescFragment::Embedded {
                            spell_id,
                            fragments,
                        }]
                    } else {
                        let token = format!("@spelldesc{}", spell_id);
                        self.warnings
                            .push(format!("Could not fetch embedded spell: {}", spell_id));
                        vec![SpellDescFragment::Unresolved { token }]
                    }
                } else {
                    vec![SpellDescFragment::Unresolved {
                        token: "@spelldesc".to_string(),
                    }]
                }
            }

            "spellname" => {
                if let Some(spell_id) = at.spell_id {
                    if let Some(name) = self.resolver.get_spell_name(spell_id) {
                        vec![SpellDescFragment::SpellName { spell_id, name }]
                    } else {
                        let token = format!("@spellname{}", spell_id);
                        self.warnings
                            .push(format!("Could not fetch spell name: {}", spell_id));
                        vec![SpellDescFragment::Unresolved { token }]
                    }
                } else {
                    vec![SpellDescFragment::Unresolved {
                        token: "@spellname".to_string(),
                    }]
                }
            }

            "spellicon" => {
                if let Some(spell_id) = at.spell_id {
                    if let Some(path) = self.resolver.get_spell_icon(spell_id) {
                        vec![SpellDescFragment::Icon { spell_id, path }]
                    } else {
                        let token = format!("@spellicon{}", spell_id);
                        self.warnings
                            .push(format!("Could not fetch spell icon: {}", spell_id));
                        vec![SpellDescFragment::Unresolved { token }]
                    }
                } else {
                    vec![SpellDescFragment::Unresolved {
                        token: "@spellicon".to_string(),
                    }]
                }
            }

            // Special @ variables that resolve to player stats
            "versadmg" | "versaheal" | "versatility" => {
                if let Some(value) = self.resolver.get_player_stat(&at.var_type) {
                    self.last_number = Some(value);
                    vec![SpellDescFragment::Value {
                        value: format!("{}%", self.format_number(value, Some(1))),
                        raw: value,
                    }]
                } else {
                    let token = format!("@{}", at.var_type);
                    self.warnings
                        .push(format!("Unresolved @ variable: {}", token));
                    vec![SpellDescFragment::Unresolved { token }]
                }
            }

            _ => {
                if let Some(value) = self.resolver.get_player_stat(&at.var_type) {
                    self.last_number = Some(value);
                    vec![SpellDescFragment::Value {
                        value: self.format_number(value, None),
                        raw: value,
                    }]
                } else {
                    let token = format!("@{}", at.var_type);
                    self.warnings
                        .push(format!("Unresolved @ variable: {}", token));
                    vec![SpellDescFragment::Unresolved { token }]
                }
            }
        }
    }

    fn render_conditional(&mut self, cond: &ConditionalNode) -> Vec<SpellDescFragment> {
        // Evaluate conditions in order
        for branch in &cond.conditions {
            if self.evaluate_predicate(&branch.predicate) {
                return self.render_nodes(&branch.content);
            }
        }

        // Fall through to else branch
        if let Some(else_branch) = &cond.else_branch {
            self.render_nodes(else_branch)
        } else {
            Vec::new()
        }
    }

    fn evaluate_predicate(&self, predicate: &ConditionalPredicateNode) -> bool {
        // OR semantics: any condition being true makes the predicate true
        predicate
            .conditions
            .iter()
            .any(|c| self.evaluate_condition(c))
    }

    fn evaluate_condition(&self, condition: &SingleConditionNode) -> bool {
        match condition {
            SingleConditionNode::SpellKnown(spell_known) => {
                self.resolver.knows_spell(spell_known.spell_id)
            }

            SingleConditionNode::Aura(aura) => self.resolver.has_aura(aura.aura_id),

            SingleConditionNode::Class(class) => self.resolver.is_class(class.class_id),

            SingleConditionNode::PlayerCondition(_) => {
                // Player conditions are server-side, default to false
                false
            }

            SingleConditionNode::Expression(expr) => {
                self.evaluate_condition_expression(&expr.func_name, &expr.args)
            }
        }
    }

    fn evaluate_condition_expression(&self, func_name: &str, args: &[ExpressionNode]) -> bool {
        let values: Vec<f64> = args.iter().map(|arg| self.evaluate_expression(arg)).collect();

        match func_name {
            "gt" => values.len() >= 2 && values[0] > values[1],
            "gte" => values.len() >= 2 && values[0] >= values[1],
            "lt" => values.len() >= 2 && values[0] < values[1],
            "lte" => values.len() >= 2 && values[0] <= values[1],
            "eq" => values.len() >= 2 && (values[0] - values[1]).abs() < f64::EPSILON,
            "cond" => {
                // $cond(condition, true_val, false_val) - here we just check if condition != 0
                !values.is_empty() && values[0] != 0.0
            }
            _ => false,
        }
    }

    fn render_pluralization(&self, plural: &PluralizationNode) -> Vec<SpellDescFragment> {
        let is_singular = self
            .last_number
            .is_some_and(|n| (n - 1.0).abs() < f64::EPSILON);

        let result = if is_singular {
            &plural.singular
        } else {
            &plural.plural
        };

        let value = capitalize_if_needed(result, plural.capitalized);
        vec![SpellDescFragment::Text { value }]
    }

    fn render_gender(&self, gender: &GenderNode) -> Vec<SpellDescFragment> {
        let result = if self.resolver.is_male() {
            &gender.male
        } else {
            &gender.female
        };

        let value = capitalize_if_needed(result, gender.capitalized);
        vec![SpellDescFragment::Text { value }]
    }

    fn evaluate_expression(&self, expr: &ExpressionNode) -> f64 {
        match expr {
            ExpressionNode::Number(num) => num.value,

            ExpressionNode::Variable(var) => self.evaluate_variable(var),

            ExpressionNode::Binary(binary) => {
                let left = self.evaluate_expression(&binary.left);
                let right = self.evaluate_expression(&binary.right);
                match binary.operator {
                    BinaryOperator::Add => left + right,
                    BinaryOperator::Sub => left - right,
                    BinaryOperator::Mul => left * right,
                    BinaryOperator::Div => {
                        if right != 0.0 {
                            left / right
                        } else {
                            0.0 // Division by zero returns 0
                        }
                    }
                }
            }

            ExpressionNode::Unary(unary) => {
                let operand = self.evaluate_expression(&unary.operand);
                match unary.operator {
                    UnaryOperator::Neg => -operand,
                }
            }

            ExpressionNode::FunctionCall(call) => {
                self.evaluate_function(&call.func_name, &call.args)
            }

            ExpressionNode::Paren(paren) => self.evaluate_expression(&paren.expression),
        }
    }

    fn evaluate_variable(&self, var: &VariableNode) -> f64 {
        match var {
            VariableNode::Effect(effect) => self
                .resolver
                .get_effect_value(self.self_spell_id, effect.effect_index, &effect.var_type)
                .unwrap_or(0.0),

            VariableNode::SpellLevel(spell_level) => {
                let key = build_spell_level_key(&spell_level.var_type, spell_level.index);
                self.resolver
                    .get_spell_value(self.self_spell_id, &key)
                    .and_then(|s| s.split_whitespace().next()?.parse().ok())
                    .unwrap_or(0.0)
            }

            VariableNode::Player(player) => {
                self.resolver.get_player_stat(&player.var_name).unwrap_or(0.0)
            }

            VariableNode::CrossSpell(cross) => {
                if let Some(idx) = cross.effect_index {
                    self.resolver
                        .get_effect_value(cross.spell_id, idx, &cross.var_type)
                        .unwrap_or(0.0)
                } else {
                    self.resolver
                        .get_spell_value(cross.spell_id, &cross.var_type)
                        .and_then(|s| s.split_whitespace().next()?.parse().ok())
                        .unwrap_or(0.0)
                }
            }

            VariableNode::Custom(custom) => {
                self.resolver.get_custom_var(&custom.var_name).unwrap_or(0.0)
            }

            VariableNode::At(at) => self.resolver.get_player_stat(&at.var_type).unwrap_or(0.0),

            VariableNode::Enchant(enchant) => self
                .resolver
                .get_spell_value(self.self_spell_id, &enchant.var_type)
                .and_then(|s| s.split_whitespace().next()?.parse().ok())
                .or_else(|| self.resolver.get_player_stat(&enchant.var_type))
                .unwrap_or(0.0),

            VariableNode::Misc(misc) => {
                let key = build_misc_key(&misc.var_name, misc.id);
                self.resolver
                    .get_spell_value(self.self_spell_id, &key)
                    .and_then(|s| s.split_whitespace().next()?.parse().ok())
                    .or_else(|| self.resolver.get_player_stat(&key))
                    .unwrap_or(0.0)
            }
        }
    }

    fn evaluate_function(&self, func_name: &str, args: &[ExpressionNode]) -> f64 {
        let values: Vec<f64> = args.iter().map(|arg| self.evaluate_expression(arg)).collect();

        match func_name {
            "max" => values.iter().cloned().fold(f64::NEG_INFINITY, f64::max),
            "min" => values.iter().cloned().fold(f64::INFINITY, f64::min),
            "floor" => values.first().map(|v| v.floor()).unwrap_or(0.0),
            "ceil" => values.first().map(|v| v.ceil()).unwrap_or(0.0),
            "abs" => values.first().map(|v| v.abs()).unwrap_or(0.0),
            "clamp" => {
                if values.len() >= 3 {
                    values[0].clamp(values[1], values[2])
                } else {
                    values.first().copied().unwrap_or(0.0)
                }
            }
            "cond" => {
                // cond(condition, true_val, false_val)
                if values.len() >= 3 {
                    if values[0] != 0.0 {
                        values[1]
                    } else {
                        values[2]
                    }
                } else {
                    0.0
                }
            }
            "gt" => {
                if values.len() >= 2 && values[0] > values[1] {
                    1.0
                } else {
                    0.0
                }
            }
            "gte" => {
                if values.len() >= 2 && values[0] >= values[1] {
                    1.0
                } else {
                    0.0
                }
            }
            "lt" => {
                if values.len() >= 2 && values[0] < values[1] {
                    1.0
                } else {
                    0.0
                }
            }
            "lte" => {
                if values.len() >= 2 && values[0] <= values[1] {
                    1.0
                } else {
                    0.0
                }
            }
            _ => 0.0,
        }
    }

    fn format_number(&self, value: f64, decimal_places: Option<u8>) -> String {
        match decimal_places {
            Some(places) => format!("{:.1$}", value, places as usize),
            None => {
                // If the value is close to an integer, show no decimals
                if (value - value.round()).abs() < FLOAT_EPSILON {
                    format!("{}", value.round() as i64)
                } else {
                    // Show up to 2 decimal places, trimming trailing zeros
                    let formatted = format!("{:.2}", value);
                    let trimmed = formatted.trim_end_matches('0').trim_end_matches('.');
                    trimmed.to_string()
                }
            }
        }
    }

    fn format_effect_value(&self, value: f64, var_type: &str) -> String {
        match var_type {
            // Period is usually in milliseconds, convert to seconds
            "t" => format!("{}", value),
            // Percentages
            "bc" => format!("{}%", self.format_number(value * 100.0, Some(1))),
            // Default number formatting
            _ => self.format_number(value, None),
        }
    }
}

// Helper functions

/// Build a key for spell-level variables like "d", "d1", "c2".
fn build_spell_level_key(var_type: &str, index: Option<u8>) -> String {
    match index {
        Some(idx) => format!("{}{}", var_type, idx),
        None => var_type.to_string(),
    }
}

/// Build a key for misc variables like "ctrmax", "ctrmax1".
fn build_misc_key(var_name: &str, id: Option<u32>) -> String {
    match id {
        Some(id) => format!("{}{}", var_name, id),
        None => var_name.to_string(),
    }
}

/// Capitalize the first character if needed.
fn capitalize_if_needed(s: &str, capitalize: bool) -> String {
    if capitalize && !s.is_empty() {
        let mut chars = s.chars();
        match chars.next() {
            Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
            None => String::new(),
        }
    } else {
        s.to_string()
    }
}

/// Try to parse a duration string to milliseconds.
/// Handles formats like "10 sec", "5 min", "1.5 sec".
fn parse_duration_ms(s: &str) -> Option<f64> {
    let parts: Vec<&str> = s.split_whitespace().collect();
    if parts.len() >= 2 {
        if let Ok(num) = parts[0].parse::<f64>() {
            let unit = parts[1].to_lowercase();
            if unit.starts_with("sec") {
                return Some(num * 1000.0);
            } else if unit.starts_with("min") {
                return Some(num * 60000.0);
            } else if unit.starts_with("hour") {
                return Some(num * 3600000.0);
            }
        }
    }
    None
}

/// Merge adjacent Text fragments for cleaner output.
fn merge_text_fragments(fragments: &mut Vec<SpellDescFragment>) {
    let mut i = 0;
    while i + 1 < fragments.len() {
        if let (SpellDescFragment::Text { value: a }, SpellDescFragment::Text { value: b }) =
            (&fragments[i], &fragments[i + 1])
        {
            let merged = format!("{}{}", a, b);
            fragments[i] = SpellDescFragment::Text { value: merged };
            fragments.remove(i + 1);
        } else {
            i += 1;
        }
    }
}
