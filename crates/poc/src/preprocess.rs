//! # Preprocessor
//!
//! Transforms `$namespace.a.b` state lookups to flat variables for constant folding.
//!
//! ## Syntax
//!
//! State lookups use `$` prefix to distinguish from local variables:
//!
//! - `$talent.foo.enabled` → `talent_foo_enabled` (state lookup)
//! - `$spell.fireball` → `"fireball"` (spell name)
//! - `talent.foo.enabled` → unchanged (local variable property)
//!
//! Methods (trailing parens) are never transformed:
//!
//! - `$spell.fireball.ready()` → unchanged (dynamic method call)

use std::collections::HashSet;

/// Configuration for which namespaces to transform.
#[derive(Clone)]
pub struct NamespaceConfig {
    /// Namespaces that flatten to variables (e.g., "talent" → talent_foo_enabled)
    pub flatten: HashSet<&'static str>,
    /// Namespaces that stringify (e.g., "spell" → "fireball")
    pub stringify: HashSet<&'static str>,
}

impl Default for NamespaceConfig {
    fn default() -> Self {
        Self {
            flatten: ["talent", "aura", "config", "target", "power", "player"]
                .into_iter()
                .collect(),
            stringify: ["spell"].into_iter().collect(),
        }
    }
}

impl NamespaceConfig {
    pub fn new(
        flatten: impl IntoIterator<Item = &'static str>,
        stringify: impl IntoIterator<Item = &'static str>,
    ) -> Self {
        Self {
            flatten: flatten.into_iter().collect(),
            stringify: stringify.into_iter().collect(),
        }
    }
}

/// Transforms `$namespace.a.b` chains to flat variables.
pub fn transform(script: &str, config: &NamespaceConfig) -> String {
    let mut result = String::with_capacity(script.len());
    let chars: Vec<char> = script.chars().collect();
    let mut i = 0;

    while i < chars.len() {
        if let Some((skip, output)) = try_skip_string(&chars, i) {
            result.push_str(&output);
            i += skip;
        } else if let Some((consumed, output)) = try_transform_state(&chars, i, config) {
            result.push_str(&output);
            i += consumed;
        } else {
            result.push(chars[i]);
            i += 1;
        }
    }

    result
}

/// Skip string literals, returning (chars_consumed, literal_text).
fn try_skip_string(chars: &[char], start: usize) -> Option<(usize, String)> {
    let quote = chars.get(start)?;
    if *quote != '"' && *quote != '\'' {
        return None;
    }

    let mut output = String::new();
    output.push(*quote);
    let mut i = start + 1;

    while i < chars.len() && chars[i] != *quote {
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

/// Try to transform `$namespace.a.b` at position `start`.
fn try_transform_state(
    chars: &[char],
    start: usize,
    config: &NamespaceConfig,
) -> Option<(usize, String)> {
    // Must start with '$'
    if chars.get(start) != Some(&'$') {
        return None;
    }

    // Parse namespace after '$'
    let ns_start = start + 1;
    let (ns, _) = parse_ident(chars, ns_start)?;

    let is_flatten = config.flatten.contains(ns.as_str());
    let is_stringify = config.stringify.contains(ns.as_str());
    if !is_flatten && !is_stringify {
        return None;
    }

    // Parse full chain: $namespace.a.b.c
    let (parts, end) = parse_chain(chars, ns_start)?;
    if parts.len() < 2 {
        return None;
    }

    // Method call (has parens) → don't transform, but strip the '$'
    if chars.get(end) == Some(&'(') {
        // Return just the chain without '$' so it can be a valid method call
        let output: String = chars[ns_start..end].iter().collect();
        return Some((end - start, output));
    }

    let consumed = end - start;
    let output = if is_stringify {
        format!("\"{}\"", parts[1..].join("_"))
    } else {
        parts.join("_")
    };

    Some((consumed, output))
}

/// Parse a dot-separated chain of identifiers.
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

/// Parse a single identifier, returning (identifier, end_position).
fn parse_ident(chars: &[char], start: usize) -> Option<(String, usize)> {
    if !is_ident_start(chars.get(start)?) {
        return None;
    }
    let mut end = start + 1;
    while end < chars.len() && is_ident_char(chars[end]) {
        end += 1;
    }
    Some((chars[start..end].iter().collect(), end))
}

fn is_ident_start(c: &char) -> bool {
    c.is_alphabetic() || *c == '_'
}

fn is_ident_char(c: char) -> bool {
    c.is_alphanumeric() || c == '_'
}

#[cfg(test)]
mod tests {
    use super::*;

    fn pp(s: &str) -> String {
        transform(s, &NamespaceConfig::default())
    }

    #[test]
    fn state_lookups_with_prefix() {
        assert_eq!(pp("$talent.foo.enabled"), "talent_foo_enabled");
        assert_eq!(pp("$talent.a.b.c"), "talent_a_b_c");
        assert_eq!(pp("$config.setting"), "config_setting");
        assert_eq!(pp("$target.health"), "target_health");
    }

    #[test]
    fn local_vars_unchanged() {
        // Without '$' prefix, these are local variable accesses
        assert_eq!(pp("talent.foo.enabled"), "talent.foo.enabled");
        assert_eq!(pp("let target = 1; target.health"), "let target = 1; target.health");
    }

    #[test]
    fn methods_strip_prefix() {
        // Methods strip '$' but stay as method calls
        assert_eq!(pp("$spell.fireball.ready()"), "spell.fireball.ready()");
        assert_eq!(pp("$aura.buff.remaining()"), "aura.buff.remaining()");
    }

    #[test]
    fn stringify_spell() {
        assert_eq!(pp("$spell.fireball"), "\"fireball\"");
        assert_eq!(pp("cast($spell.execute)"), "cast(\"execute\")");
    }

    #[test]
    fn preserves_strings() {
        assert_eq!(pp(r#""$talent.foo""#), r#""$talent.foo""#);
    }

    #[test]
    fn unknown_namespace() {
        // Unknown namespaces with '$' stay as-is
        assert_eq!(pp("$foo.bar"), "$foo.bar");
    }

    #[test]
    fn mixed_expression() {
        let input = "if $talent.killer.enabled && $target.health < 0.2 { cast($spell.execute) }";
        let expected = "if talent_killer_enabled && target_health < 0.2 { cast(\"execute\") }";
        assert_eq!(pp(input), expected);
    }
}
