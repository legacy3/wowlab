//! Dependency analyzer for spell descriptions.
//!
//! Walks the parsed AST and extracts all data dependencies needed to render
//! the description. This allows the caller to fetch all required data upfront.

use super::types::*;
use wowlab_types::SpellDescDependencies;

/// Analyze a parsed spell description and extract all dependencies.
///
/// # Arguments
/// * `ast` - The parsed spell description AST
/// * `self_spell_id` - The spell ID of the spell being analyzed (for self-references)
///
/// # Returns
/// A `SpellDescDependencies` struct containing all data needed to render the description.
pub fn analyze_dependencies(ast: &ParsedSpellDescription, self_spell_id: u32) -> SpellDescDependencies {
    let mut deps = SpellDescDependencies::new();
    deps.add_spell_id(self_spell_id);

    for node in &ast.nodes {
        analyze_node(node, self_spell_id, &mut deps);
    }

    deps
}

fn analyze_node(node: &SpellDescriptionNode, self_spell_id: u32, deps: &mut SpellDescDependencies) {
    match node {
        SpellDescriptionNode::Text(_) => {}
        SpellDescriptionNode::ColorCode(_) => {}

        SpellDescriptionNode::Variable(var) => {
            analyze_variable(var, self_spell_id, deps);
        }

        SpellDescriptionNode::ExpressionBlock(block) => {
            analyze_expression(&block.expression, self_spell_id, deps);
        }

        SpellDescriptionNode::Conditional(cond) => {
            // Analyze all branches
            for branch in &cond.conditions {
                analyze_predicate(&branch.predicate, deps);
                for node in &branch.content {
                    analyze_node(node, self_spell_id, deps);
                }
            }
            if let Some(else_branch) = &cond.else_branch {
                for node in else_branch {
                    analyze_node(node, self_spell_id, deps);
                }
            }
        }

        SpellDescriptionNode::Pluralization(_) => {
            // Pluralization depends on the previous number, no extra deps
        }

        SpellDescriptionNode::Gender(_) => {
            deps.needs_gender = true;
        }
    }
}

fn analyze_variable(var: &VariableNode, self_spell_id: u32, deps: &mut SpellDescDependencies) {
    match var {
        VariableNode::Effect(effect) => {
            deps.add_effect(self_spell_id, effect.effect_index, effect.var_type.clone());
        }

        VariableNode::SpellLevel(spell_level) => {
            deps.add_spell_value(self_spell_id, spell_level.var_type.clone());
        }

        VariableNode::Player(player) => {
            deps.add_player_stat(player.var_name.clone());
        }

        VariableNode::CrossSpell(cross) => {
            if let Some(idx) = cross.effect_index {
                deps.add_effect(cross.spell_id, idx, cross.var_type.clone());
            } else {
                deps.add_spell_value(cross.spell_id, cross.var_type.clone());
            }
        }

        VariableNode::Custom(custom) => {
            deps.add_custom_var(custom.var_name.clone());
        }

        VariableNode::At(at) => {
            match at.var_type.as_str() {
                "spelldesc" | "spellname" | "spellicon" => {
                    if let Some(spell_id) = at.spell_id {
                        deps.add_embedded_spell(spell_id);
                    }
                }
                _ => {
                    // Other @ variables like @versadmg don't need spell data
                    deps.add_player_stat(at.var_type.clone());
                }
            }
        }

        VariableNode::Enchant(_) => {
            // Enchant variables require special handling, not covered here
        }

        VariableNode::Misc(misc) => {
            // Misc variables like $maxcast, $pctD, $W, $B
            // These may need player stats or special handling
            match misc.var_name.as_str() {
                "maxcast" | "pctD" | "W" | "B" => {
                    deps.add_player_stat(misc.var_name.clone());
                }
                _ => {}
            }
        }
    }
}

fn analyze_expression(expr: &ExpressionNode, self_spell_id: u32, deps: &mut SpellDescDependencies) {
    match expr {
        ExpressionNode::Variable(var) => {
            analyze_variable(var, self_spell_id, deps);
        }

        ExpressionNode::Binary(binary) => {
            analyze_expression(&binary.left, self_spell_id, deps);
            analyze_expression(&binary.right, self_spell_id, deps);
        }

        ExpressionNode::Unary(unary) => {
            analyze_expression(&unary.operand, self_spell_id, deps);
        }

        ExpressionNode::FunctionCall(call) => {
            for arg in &call.args {
                analyze_expression(arg, self_spell_id, deps);
            }
        }

        ExpressionNode::Number(_) => {}

        ExpressionNode::Paren(paren) => {
            analyze_expression(&paren.expression, self_spell_id, deps);
        }
    }
}

fn analyze_predicate(predicate: &ConditionalPredicateNode, deps: &mut SpellDescDependencies) {
    for condition in &predicate.conditions {
        match condition {
            SingleConditionNode::SpellKnown(spell_known) => {
                deps.add_spell_known_check(spell_known.spell_id);
            }

            SingleConditionNode::Aura(aura) => {
                deps.add_aura_check(aura.aura_id);
            }

            SingleConditionNode::Class(class) => {
                deps.add_class_check(class.class_id);
            }

            SingleConditionNode::PlayerCondition(_) => {
                // Player conditions are special server-side checks
            }

            SingleConditionNode::Expression(expr_cond) => {
                for arg in &expr_cond.args {
                    // Use 0 as placeholder - the expression analyzer handles self_spell_id
                    analyze_expression(arg, 0, deps);
                }
            }
        }
    }
}
