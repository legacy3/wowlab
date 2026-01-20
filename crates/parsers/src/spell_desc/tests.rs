//! Tests for spell description parsing

use super::*;

// ============================================================================
// Variable parsing tests
// ============================================================================

#[test]
fn parse_effect_variable() {
    let result = parse("Deals $s1 damage.");
    assert!(result.errors.is_empty());

    let var = result
        .ast
        .nodes
        .iter()
        .find_map(|n| match n {
            SpellDescriptionNode::Variable(VariableNode::Effect(e)) => Some(e),
            _ => None,
        })
        .expect("should have effect variable");

    assert_eq!(var.var_type, "s");
    assert_eq!(var.effect_index, 1);
}

#[test]
fn parse_spell_level_duration() {
    let result = parse("Lasts $d.");
    assert!(result.errors.is_empty());

    let var = result
        .ast
        .nodes
        .iter()
        .find_map(|n| match n {
            SpellDescriptionNode::Variable(VariableNode::SpellLevel(s)) => Some(s),
            _ => None,
        })
        .expect("should have spell level variable");

    assert_eq!(var.var_type, "d");
    assert_eq!(var.index, None);
}

#[test]
fn parse_player_stat_variable() {
    let result = parse("Scaling with $SP.");
    assert!(result.errors.is_empty());

    let var = result
        .ast
        .nodes
        .iter()
        .find_map(|n| match n {
            SpellDescriptionNode::Variable(VariableNode::Player(p)) => Some(p),
            _ => None,
        })
        .expect("should have player variable");

    assert_eq!(var.var_name, "SP");
}

#[test]
fn parse_cross_spell_reference() {
    let result = parse("See $12345s2 for details.");
    assert!(result.errors.is_empty());

    let var = result
        .ast
        .nodes
        .iter()
        .find_map(|n| match n {
            SpellDescriptionNode::Variable(VariableNode::CrossSpell(c)) => Some(c),
            _ => None,
        })
        .expect("should have cross spell reference");

    assert_eq!(var.spell_id, 12345);
    assert_eq!(var.var_type, "s");
    assert_eq!(var.effect_index, Some(2));
}

#[test]
fn parse_pluralization() {
    let result = parse("$s1 $lstack:stacks;");
    assert!(result.errors.is_empty());

    let plural = result
        .ast
        .nodes
        .iter()
        .find_map(|n| match n {
            SpellDescriptionNode::Pluralization(p) => Some(p),
            _ => None,
        })
        .expect("should have pluralization");

    assert_eq!(plural.singular, "stack");
    assert_eq!(plural.plural, "stacks");
    assert!(!plural.capitalized);
}

#[test]
fn parse_capitalized_pluralization() {
    let result = parse("$Lstack:stacks;");
    assert!(result.errors.is_empty());

    let plural = result
        .ast
        .nodes
        .iter()
        .find_map(|n| match n {
            SpellDescriptionNode::Pluralization(p) => Some(p),
            _ => None,
        })
        .expect("should have pluralization");

    assert!(plural.capitalized);
}

#[test]
fn parse_gender() {
    let result = parse("$ghis:her;");
    assert!(result.errors.is_empty());

    let gender = result
        .ast
        .nodes
        .iter()
        .find_map(|n| match n {
            SpellDescriptionNode::Gender(g) => Some(g),
            _ => None,
        })
        .expect("should have gender");

    assert_eq!(gender.male, "his");
    assert_eq!(gender.female, "her");
    assert!(!gender.capitalized);
}

#[test]
fn parse_at_variable() {
    let result = parse("$@spelldesc123");
    assert!(result.errors.is_empty());

    let var = result
        .ast
        .nodes
        .iter()
        .find_map(|n| match n {
            SpellDescriptionNode::Variable(VariableNode::At(a)) => Some(a),
            _ => None,
        })
        .expect("should have at variable");

    assert_eq!(var.var_type, "spelldesc");
    assert_eq!(var.spell_id, Some(123));
}

#[test]
fn parse_custom_variable() {
    let result = parse("$<healing>");
    assert!(result.errors.is_empty());

    let var = result
        .ast
        .nodes
        .iter()
        .find_map(|n| match n {
            SpellDescriptionNode::Variable(VariableNode::Custom(c)) => Some(c),
            _ => None,
        })
        .expect("should have custom variable");

    assert_eq!(var.var_name, "healing");
}

#[test]
fn parse_color_code() {
    let result = parse("|cFFFFFFFFText|r");
    assert!(result.errors.is_empty());

    let colors: Vec<_> = result
        .ast
        .nodes
        .iter()
        .filter_map(|n| match n {
            SpellDescriptionNode::ColorCode(c) => Some(c),
            _ => None,
        })
        .collect();

    assert_eq!(colors.len(), 2);
    assert_eq!(colors[0].code, "cFFFFFFFF");
    assert_eq!(colors[1].code, "r");
}

// ============================================================================
// Node ordering tests
// ============================================================================

#[test]
fn preserves_node_order() {
    let result = parse("Deals $s1 damage over $d.");
    assert!(result.errors.is_empty());

    let types: Vec<_> = result
        .ast
        .nodes
        .iter()
        .map(|n| match n {
            SpellDescriptionNode::Text(_) => "text",
            SpellDescriptionNode::Variable(VariableNode::Effect(_)) => "effect",
            SpellDescriptionNode::Variable(VariableNode::SpellLevel(_)) => "spellLevel",
            _ => "other",
        })
        .collect();

    assert_eq!(types, vec!["text", "effect", "text", "spellLevel", "text"]);
}

// ============================================================================
// Expression tests
// ============================================================================

#[test]
fn parse_simple_expression() {
    let result = parse("${$s1 + $SP}");
    assert!(result.errors.is_empty());

    let expr_block = result
        .ast
        .nodes
        .iter()
        .find_map(|n| match n {
            SpellDescriptionNode::ExpressionBlock(e) => Some(e),
            _ => None,
        })
        .expect("should have expression block");

    match &expr_block.expression {
        ExpressionNode::Binary(bin) => {
            assert!(matches!(bin.operator, BinaryOperator::Add));
        }
        _ => panic!("expected binary expression"),
    }
}

#[test]
fn parse_expression_with_function() {
    let result = parse("${$max($s1, $s2)}");
    assert!(result.errors.is_empty());

    let expr_block = result
        .ast
        .nodes
        .iter()
        .find_map(|n| match n {
            SpellDescriptionNode::ExpressionBlock(e) => Some(e),
            _ => None,
        })
        .expect("should have expression block");

    match &expr_block.expression {
        ExpressionNode::FunctionCall(f) => {
            assert_eq!(f.func_name, "max");
            assert_eq!(f.args.len(), 2);
        }
        _ => panic!("expected function call"),
    }
}

#[test]
fn parse_expression_with_decimal_format() {
    // Format specifier .1 at the end means "show 1 decimal place"
    let result = parse("${$s1 / 100 .1}");
    assert!(result.errors.is_empty());

    let expr_block = result
        .ast
        .nodes
        .iter()
        .find_map(|n| match n {
            SpellDescriptionNode::ExpressionBlock(e) => Some(e),
            _ => None,
        })
        .expect("should have expression block");

    assert_eq!(expr_block.decimal_places, Some(1));
}

#[test]
fn parse_complex_expression() {
    let result = parse("${($s1 * 2 + $SP) / 100}");
    assert!(result.errors.is_empty());
    assert!(result.ast.nodes.len() == 1);
}

// ============================================================================
// Conditional tests
// ============================================================================

#[test]
fn parse_simple_conditional() {
    let result = parse("$?a123[has aura][no aura]");
    assert!(result.errors.is_empty());

    let cond = result
        .ast
        .nodes
        .iter()
        .find_map(|n| match n {
            SpellDescriptionNode::Conditional(c) => Some(c),
            _ => None,
        })
        .expect("should have conditional");

    assert_eq!(cond.conditions.len(), 1);
    assert!(cond.else_branch.is_some());
}

#[test]
fn parse_chained_conditional() {
    let result = parse("$?a123[first]?s456[second][else]");
    assert!(result.errors.is_empty());

    let cond = result
        .ast
        .nodes
        .iter()
        .find_map(|n| match n {
            SpellDescriptionNode::Conditional(c) => Some(c),
            _ => None,
        })
        .expect("should have conditional");

    assert_eq!(cond.conditions.len(), 2);
    assert!(cond.else_branch.is_some());
}

#[test]
fn conditional_does_not_throw() {
    let result = parse("$?a123[text][else]");
    assert!(result.errors.is_empty());
}

// ============================================================================
// Combined tests
// ============================================================================

#[test]
fn parse_at_vars_pluralization_gender_together() {
    let result = parse("$@spelldesc123 $lstack:stacks; $ghis:her;");
    assert!(result.errors.is_empty());

    assert!(result.ast.nodes.iter().any(|n| matches!(
        n,
        SpellDescriptionNode::Variable(VariableNode::At(a)) if a.spell_id == Some(123)
    )));

    assert!(result.ast.nodes.iter().any(|n| matches!(
        n,
        SpellDescriptionNode::Pluralization(p) if p.singular == "stack"
    )));

    assert!(result.ast.nodes.iter().any(|n| matches!(
        n,
        SpellDescriptionNode::Gender(g) if g.male == "his"
    )));
}

#[test]
fn parse_misc_and_enchant_vars() {
    let result = parse("|cFFFFFFFF$maxcast $ec1|r");
    assert!(result.errors.is_empty());

    assert!(result.ast.nodes.iter().any(|n| matches!(
        n,
        SpellDescriptionNode::Variable(VariableNode::Misc(m)) if m.var_name == "maxcast"
    )));

    assert!(result.ast.nodes.iter().any(|n| matches!(
        n,
        SpellDescriptionNode::Variable(VariableNode::Enchant(e)) if e.var_type == "ec1"
    )));
}

// ============================================================================
// Lexer tests
// ============================================================================

#[test]
fn tokenize_basic_description() {
    let tokens = tokenize("Deals $s1 damage.");
    assert!(tokens.len() >= 3);
}

#[test]
fn tokenize_expression_block() {
    let tokens = tokenize("${$s1 + 5}");
    assert!(tokens
        .iter()
        .any(|t| matches!(t, Token::ExpressionBlock(_))));
}

#[test]
fn tokenize_conditional() {
    let tokens = tokenize("$?a123[yes][no]");
    assert!(tokens.iter().any(|t| matches!(t, Token::ConditionalStart)));
}
