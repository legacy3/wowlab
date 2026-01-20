//! AST node types for parsed spell descriptions
//!
//! WoW spell tooltips use a template language with variables like `$s1`, `$d`,
//! conditionals like `$?a123[true][false]`, expressions like `${$s1 * 2}`, etc.

use serde::{Deserialize, Serialize};
use tsify_next::Tsify;

// ============================================================================
// Top-level types
// ============================================================================

/// A fully parsed spell description
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi)]
#[serde(rename_all = "camelCase")]
pub struct ParsedSpellDescription {
    pub nodes: Vec<SpellDescriptionNode>,
}

/// Top-level node in a spell description
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Tsify)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum SpellDescriptionNode {
    Text(TextNode),
    Variable(VariableNode),
    ExpressionBlock(ExpressionBlockNode),
    Conditional(ConditionalNode),
    Pluralization(PluralizationNode),
    Gender(GenderNode),
    ColorCode(ColorCodeNode),
}

// ============================================================================
// Basic nodes
// ============================================================================

/// Plain text content
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct TextNode {
    pub value: String,
}

/// Color code like |cFFFFFFFF or |r
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct ColorCodeNode {
    pub code: String,
}

// ============================================================================
// Variable nodes
// ============================================================================

/// Any variable reference in a spell description
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Tsify)]
#[serde(tag = "varKind", rename_all = "camelCase")]
pub enum VariableNode {
    /// Effect variable: $s1, $m1, $t1, $a1, $o1, $bc1, etc.
    Effect(EffectVariableNode),
    /// Spell-level variable: $d, $n, $h, $r, $i, $p, $z, $c1
    SpellLevel(SpellLevelVariableNode),
    /// Player stat variable: $SP, $AP, $MHP, $PL, $INT
    Player(PlayerVariableNode),
    /// Cross-spell reference: $123456s1, $123456d
    CrossSpell(CrossSpellReferenceNode),
    /// Custom variable: $<varname>
    Custom(CustomVariableNode),
    /// @ variable: @spelldesc123, @spellname456
    At(AtVariableNode),
    /// Enchant variable: $ec1, $ecix, $ecd
    Enchant(EnchantVariableNode),
    /// Misc variable: $maxcast, $pctD, $W, $B, $ctrmax1
    Misc(MiscVariableNode),
}

/// Effect variable like $s1, $m1, $t1, $a1, $o1, $bc1
/// The index is 1-9, varType is s/m/M/o/t/a/A/e/w/x/bc/q
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct EffectVariableNode {
    pub var_type: String,
    pub effect_index: u8,
}

/// Spell-level variable like $d (duration), $n (charges), $h (proc chance)
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct SpellLevelVariableNode {
    pub var_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub index: Option<u8>,
}

/// Player stat variable like $SP (spell power), $AP (attack power), $MHP (max health)
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct PlayerVariableNode {
    pub var_name: String,
}

/// Cross-spell reference like $123456s1 (spell 123456, effect 1, base points)
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct CrossSpellReferenceNode {
    pub spell_id: u32,
    pub var_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub effect_index: Option<u8>,
}

/// Custom variable from spell's description_variables like $<healing>
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct CustomVariableNode {
    pub var_name: String,
}

/// @ variable like @spelldesc123, @spellname456, @versadmg
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct AtVariableNode {
    pub var_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub spell_id: Option<u32>,
}

/// Enchant variable like $ec1, $ecix, $ecd
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct EnchantVariableNode {
    pub var_type: String,
}

/// Misc variable like $maxcast, $pctD, $W, $W2, $B, $ctrmax1
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct MiscVariableNode {
    pub var_name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<u32>,
}

// ============================================================================
// Pluralization and Gender
// ============================================================================

/// Pluralization node like $lstack:stacks; or $Lstack:stacks;
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct PluralizationNode {
    pub singular: String,
    pub plural: String,
    pub capitalized: bool,
}

/// Gender node like $ghis:her; or $Ghis:her;
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct GenderNode {
    pub male: String,
    pub female: String,
    pub capitalized: bool,
}

// ============================================================================
// Expression blocks
// ============================================================================

/// Expression block like ${$s1 * 2 + $SP / 100}
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct ExpressionBlockNode {
    pub expression: ExpressionNode,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub decimal_places: Option<u8>,
}

/// An expression that evaluates to a number
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Tsify)]
#[serde(tag = "exprType", rename_all = "camelCase")]
pub enum ExpressionNode {
    Binary(BinaryExpressionNode),
    Unary(UnaryExpressionNode),
    FunctionCall(FunctionCallNode),
    Variable(Box<VariableNode>),
    Number(NumberLiteralNode),
    Paren(ParenExpressionNode),
}

/// Binary expression like $s1 + $SP
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct BinaryExpressionNode {
    pub left: Box<ExpressionNode>,
    pub operator: BinaryOperator,
    pub right: Box<ExpressionNode>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub enum BinaryOperator {
    Add,
    Sub,
    Mul,
    Div,
}

/// Unary expression like -$s1
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct UnaryExpressionNode {
    pub operator: UnaryOperator,
    pub operand: Box<ExpressionNode>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub enum UnaryOperator {
    Neg,
}

/// Function call like $gt($s1, 5), $max($s1, $s2), floor($s1 / 100)
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct FunctionCallNode {
    pub func_name: String,
    pub args: Vec<ExpressionNode>,
}

/// Number literal like 100 or 3.5
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct NumberLiteralNode {
    pub value: f64,
}

/// Parenthesized expression
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct ParenExpressionNode {
    pub expression: Box<ExpressionNode>,
}

// ============================================================================
// Conditionals
// ============================================================================

/// Conditional like $?a123[true text][false text] or $?s456[known]?a789[has aura][else]
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct ConditionalNode {
    pub conditions: Vec<ConditionalBranchNode>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub else_branch: Option<Vec<SpellDescriptionNode>>,
}

/// A single condition branch: predicate + content
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct ConditionalBranchNode {
    pub predicate: ConditionalPredicateNode,
    pub content: Vec<SpellDescriptionNode>,
}

/// Predicate for a conditional (OR of conditions)
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct ConditionalPredicateNode {
    pub conditions: Vec<SingleConditionNode>,
}

/// A single condition in a predicate
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Tsify)]
#[serde(tag = "condType", rename_all = "camelCase")]
pub enum SingleConditionNode {
    /// Spell known: s123456
    SpellKnown(SpellKnownConditionNode),
    /// Aura active: a123456
    Aura(AuraConditionNode),
    /// Class check: c7
    Class(ClassConditionNode),
    /// Player condition: pc999
    PlayerCondition(PlayerConditionNode),
    /// Expression condition: $gt($s1, 5)
    Expression(ExpressionConditionNode),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct SpellKnownConditionNode {
    pub spell_id: u32,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct AuraConditionNode {
    pub aura_id: u32,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct ClassConditionNode {
    pub class_id: u32,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct PlayerConditionNode {
    pub condition_id: u32,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct ExpressionConditionNode {
    pub func_name: String,
    pub args: Vec<ExpressionNode>,
}
