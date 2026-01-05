//! Script preprocessor for state variable transformation.
//!
//! Transforms `$state` lookups into flat variables for constant folding.
//!
//! # Key Insight
//!
//! Scripts are pure - they cannot mutate `$state`. This means:
//! - `$talent.foo.enabled` returns the same value everywhere in one tick
//! - `$spell.bar.ready()` returns the same value everywhere in one tick
//!
//! So we can evaluate ALL lookups ONCE, inject as constants, and fold aggressively.
//!
//! # Transformation
//!
//! ```text
//! $talent.foo.enabled    -> talent_foo_enabled       (property)
//! $spell.bar.ready()     -> __m0                     (method call, extracted)
//! $spell.bar             -> "bar"                    (stringify for cast())
//! ```
//!
//! Method calls are extracted into a lookup table. At runtime:
//! 1. Evaluate each extracted call ONCE
//! 2. Inject ALL (properties + call results) as constants
//! 3. Optimize to minimal AST

use std::collections::HashSet;

/// Result of preprocessing a script.
#[derive(Debug, Clone)]
pub struct TransformResult {
    /// Transformed script with method calls replaced by placeholder variables.
    pub script: String,
    /// Extracted method calls that need evaluation at runtime.
    pub method_calls: Vec<MethodCall>,
}

impl TransformResult {
    /// Returns true if no method calls were extracted.
    #[must_use]
    pub fn has_no_methods(&self) -> bool {
        self.method_calls.is_empty()
    }
}

/// An extracted method call from the script.
///
/// Method calls like `$spell.kill_command.ready()` are extracted and replaced
/// with placeholder variables (e.g., `__m0`). The caller evaluates these once
/// per tick and injects the results as constants.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct MethodCall {
    /// Placeholder variable name in the transformed script (e.g., `__m0`).
    pub var: String,
    /// Namespace of the call (e.g., `spell`, `aura`).
    pub namespace: String,
    /// Path segments between namespace and method (e.g., `["kill_command"]`).
    pub path: Vec<String>,
    /// Method name being called (e.g., `ready`).
    pub method: String,
}

/// Configuration for how different namespaces are transformed.
///
/// - **Flatten namespaces**: Property chains become underscore-joined variables.
///   Example: `$talent.foo.enabled` -> `talent_foo_enabled`
///
/// - **Stringify namespaces**: The path becomes a string literal for use with `cast()`.
///   Example: `$spell.fireball` -> `"fireball"`
#[derive(Clone, Debug)]
pub struct NamespaceConfig {
    /// Namespaces where property chains are flattened to variables.
    pub flatten: HashSet<&'static str>,
    /// Namespaces where the path is converted to a string literal.
    pub stringify: HashSet<&'static str>,
}

impl Default for NamespaceConfig {
    fn default() -> Self {
        Self {
            flatten: [
                "talent", "aura", "config", "target", "power", "player", "cooldown",
            ]
            .into_iter()
            .collect(),
            stringify: ["spell"].into_iter().collect(),
        }
    }
}

impl NamespaceConfig {
    /// Creates a new namespace configuration.
    #[must_use]
    pub fn new(
        flatten: impl IntoIterator<Item = &'static str>,
        stringify: impl IntoIterator<Item = &'static str>,
    ) -> Self {
        Self {
            flatten: flatten.into_iter().collect(),
            stringify: stringify.into_iter().collect(),
        }
    }

    /// Returns true if the namespace is recognized (either flatten or stringify).
    fn is_known(&self, ns: &str) -> bool {
        self.flatten.contains(ns) || self.stringify.contains(ns)
    }
}

/// Transforms a script by replacing `$state` lookups with flat variables.
///
/// Returns the transformed script and a list of extracted method calls that
/// need to be evaluated at runtime.
#[must_use]
pub fn transform(script: &str, config: &NamespaceConfig) -> TransformResult {
    let mut ctx = TransformContext::new(config);
    let transformed = ctx.transform(script);
    TransformResult {
        script: transformed,
        method_calls: ctx.method_calls,
    }
}

/// Internal context for script transformation.
struct TransformContext<'a> {
    config: &'a NamespaceConfig,
    method_calls: Vec<MethodCall>,
    call_index: usize,
}

impl<'a> TransformContext<'a> {
    fn new(config: &'a NamespaceConfig) -> Self {
        Self {
            config,
            method_calls: Vec::new(),
            call_index: 0,
        }
    }

    fn transform(&mut self, script: &str) -> String {
        let mut result = String::with_capacity(script.len());
        let chars: Vec<char> = script.chars().collect();
        let mut i = 0;

        while i < chars.len() {
            if let Some((skip, output)) = try_skip_string(&chars, i) {
                result.push_str(&output);
                i += skip;
            } else if let Some((consumed, output)) = self.try_transform_state(&chars, i) {
                result.push_str(&output);
                i += consumed;
            } else {
                result.push(chars[i]);
                i += 1;
            }
        }

        result
    }

    /// Attempts to transform a `$state` lookup at the given position.
    ///
    /// Returns `Some((chars_consumed, replacement_string))` if successful.
    fn try_transform_state(&mut self, chars: &[char], start: usize) -> Option<(usize, String)> {
        // Must start with '$'
        if chars.get(start) != Some(&'$') {
            return None;
        }

        let ns_start = start + 1;
        let (ns, _) = parse_ident(chars, ns_start)?;

        if !self.config.is_known(&ns) {
            return None;
        }

        // Parse full chain (e.g., "spell.fireball.ready")
        let (parts, mut end) = parse_chain(chars, ns_start)?;
        if parts.len() < 2 {
            return None;
        }

        // Check for method call: ends with `(...)`
        if chars.get(end) == Some(&'(') {
            let args_end = find_matching_paren(chars, end)?;
            end = args_end + 1;

            // Extract method call and replace with placeholder variable
            let var = format!("__m{}", self.call_index);
            self.call_index += 1;

            let path = parts[1..parts.len() - 1].to_vec();
            let method = parts.last()?.clone();

            self.method_calls.push(MethodCall {
                var: var.clone(),
                namespace: ns,
                path,
                method,
            });

            return Some((end - start, var));
        }

        // Property access: flatten or stringify based on namespace config
        let consumed = end - start;
        let output = if self.config.stringify.contains(ns.as_str()) {
            format!("\"{}\"", parts[1..].join("_"))
        } else {
            parts.join("_")
        };

        Some((consumed, output))
    }
}

/// Skips over a string literal, preserving it verbatim.
///
/// Returns `Some((chars_consumed, string_content))` if a string starts at `start`.
fn try_skip_string(chars: &[char], start: usize) -> Option<(usize, String)> {
    let quote = *chars.get(start)?;
    if quote != '"' && quote != '\'' {
        return None;
    }

    let mut output = String::new();
    output.push(quote);
    let mut i = start + 1;

    while i < chars.len() && chars[i] != quote {
        if chars[i] == '\\' && i + 1 < chars.len() {
            output.push(chars[i]);
            output.push(chars[i + 1]);
            i += 2;
        } else {
            output.push(chars[i]);
            i += 1;
        }
    }

    if i < chars.len() {
        output.push(chars[i]);
        i += 1;
    }

    Some((i - start, output))
}

/// Parses a dot-separated chain of identifiers (e.g., `spell.fireball.ready`).
///
/// Returns the list of parts and the position after the last identifier.
fn parse_chain(chars: &[char], start: usize) -> Option<(Vec<String>, usize)> {
    let mut parts = Vec::new();
    let (first, mut pos) = parse_ident(chars, start)?;
    parts.push(first);

    while chars.get(pos) == Some(&'.') {
        if let Some((ident, end)) = parse_ident(chars, pos + 1) {
            parts.push(ident);
            pos = end;
        } else {
            break;
        }
    }

    Some((parts, pos))
}

/// Parses a single identifier starting at `start`.
///
/// Identifiers must start with a letter or underscore, followed by
/// alphanumeric characters or underscores.
fn parse_ident(chars: &[char], start: usize) -> Option<(String, usize)> {
    let c = chars.get(start)?;
    if !c.is_alphabetic() && *c != '_' {
        return None;
    }
    let mut end = start + 1;
    while end < chars.len() && (chars[end].is_alphanumeric() || chars[end] == '_') {
        end += 1;
    }
    Some((chars[start..end].iter().collect(), end))
}

/// Finds the matching closing parenthesis, handling nesting and strings.
///
/// Returns the index of the closing `)` or `None` if unbalanced.
fn find_matching_paren(chars: &[char], start: usize) -> Option<usize> {
    if chars.get(start) != Some(&'(') {
        return None;
    }
    let mut depth = 1;
    let mut i = start + 1;
    while i < chars.len() && depth > 0 {
        match chars[i] {
            '(' => depth += 1,
            ')' => depth -= 1,
            '"' | '\'' => {
                // Skip string literals inside parentheses
                let quote = chars[i];
                i += 1;
                while i < chars.len() && chars[i] != quote {
                    if chars[i] == '\\' {
                        i += 1;
                    }
                    i += 1;
                }
            }
            _ => {}
        }
        i += 1;
    }
    if depth == 0 { Some(i - 1) } else { None }
}
