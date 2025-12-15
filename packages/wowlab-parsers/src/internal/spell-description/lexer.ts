import { createToken, Lexer } from "chevrotain";

// complex variable patterns must come before simpler tokens

export const ExpressionBlockStart = createToken({
  name: "ExpressionBlockStart",
  pattern: /\$\{/,
  push_mode: "expression",
});

export const CustomVariable = createToken({
  name: "CustomVariable",
  pattern: /\$<[a-zA-Z][a-zA-Z0-9]*>/,
});

export const EffectVariable = createToken({
  name: "EffectVariable",
  pattern: /\$(?:s|m|M|o|t|a|A|e|w|x|bc|q)[1-9]/,
});

export const SpellLevelVariable = createToken({
  name: "SpellLevelVariable",
  pattern: /\$(?:d[1-3]?|n|u|h|r|i|p\d?|z|c\d)/,
});

export const PlayerVariable = createToken({
  name: "PlayerVariable",
  pattern: /\$(?:SP|sp|AP|ap|RAP|MHP|mhp|SPS|PL|pl|INT)/,
});

export const EnchantVariable = createToken({
  name: "EnchantVariable",
  pattern: /\$(?:ec1|ecix|ecd)/,
});

export const MiscVariable = createToken({
  name: "MiscVariable",
  pattern: /\$(?:maxcast|pctD|W2?|B|ctrmax\d+)/,
});

export const AtVariable = createToken({
  name: "AtVariable",
  pattern: /\$@[a-zA-Z]+\d*/,
});

export const ConditionalStart = createToken({
  name: "ConditionalStart",
  pattern: /\$\?/,
  push_mode: "conditional",
});

export const Pluralization = createToken({
  name: "Pluralization",
  pattern: /\$[lL][^:;]*:[^;]*;/,
});

export const Gender = createToken({
  name: "Gender",
  pattern: /\$[gG][^:;]*:[^;]*;/,
});

// $123456s1, $123456d, $123456bc1
export const CrossSpellRef = createToken({
  name: "CrossSpellRef",
  pattern: /\$\d+[a-zA-Z]+\d*/,
});

// $s1, $d, $SP, $MHP, $bc1, $maxcast, etc
export const SimpleVariable = createToken({
  name: "SimpleVariable",
  pattern: /\$[a-zA-Z_][a-zA-Z0-9_]*/,
});

export const Dollar = createToken({
  name: "Dollar",
  pattern: /\$/,
});

export const ColorCode = createToken({
  name: "ColorCode",
  pattern: /\|[a-zA-Z][a-zA-Z0-9]*/,
});

export const Pipe = createToken({
  name: "Pipe",
  pattern: /\|/,
});

export const LBracket = createToken({
  name: "LBracket",
  pattern: /\[/,
  push_mode: "condBranch",
});

export const RBracket = createToken({
  name: "RBracket",
  pattern: /\]/,
});

export const Text = createToken({
  name: "Text",
  pattern: /[^$|[\]?]+/, // exclude ? for chained conditionals
});

export const ChainCondQuestion = createToken({
  name: "ChainCondQuestion",
  pattern: /\?/,
  push_mode: "conditional",
});

// expression mode tokens

export const ExpressionBlockEnd = createToken({
  name: "ExpressionBlockEnd",
  pattern: /\}/,
  pop_mode: true,
});

export const ExprDecimalFormat = createToken({
  name: "ExprDecimalFormat",
  pattern: /\.\d/,
});

export const ExprCustomVar = createToken({
  name: "ExprCustomVar",
  pattern: /\$<[a-zA-Z][a-zA-Z0-9]*>/,
});

export const ExprEffectVar = createToken({
  name: "ExprEffectVar",
  pattern: /\$(?:s|m|M|o|t|a|A|e|w|x|bc|q)[1-9]/,
});

export const ExprSpellLevelVar = createToken({
  name: "ExprSpellLevelVar",
  pattern: /\$(?:d[1-3]?|n|u|h|r|i|p\d?|z|c\d)/,
});

export const ExprPlayerVar = createToken({
  name: "ExprPlayerVar",
  pattern: /\$(?:SP|sp|AP|ap|RAP|MHP|mhp|SPS|PL|pl|INT)/,
});

export const ExprEnchantVar = createToken({
  name: "ExprEnchantVar",
  pattern: /\$(?:ec1|ecix|ecd)/,
});

export const ExprMiscVar = createToken({
  name: "ExprMiscVar",
  pattern: /\$(?:maxcast|pctD|W2?|B|ctrmax\d+)/,
});

export const ExprAtVar = createToken({
  name: "ExprAtVar",
  pattern: /\$@[a-zA-Z]+\d*/,
});

export const ExprCrossSpellRef = createToken({
  name: "ExprCrossSpellRef",
  pattern: /\$\d+[a-zA-Z]+\d*/,
});

// $cond, $gt, $max etc. order: gte before gt, lte before lt
export const ExprDollarFunc = createToken({
  name: "ExprDollarFunc",
  pattern: /\$(?:cond|gte|gt|lte|lt|max|min|clamp|floor)/,
});

export const ExprSimpleVar = createToken({
  name: "ExprSimpleVar",
  pattern: /\$[a-zA-Z_][a-zA-Z0-9_]*/,
});

export const ExprNumber = createToken({
  name: "ExprNumber",
  pattern: /\d+(?:\.\d+)?/,
});

export const ExprIdentifier = createToken({
  name: "ExprIdentifier",
  pattern: /[a-zA-Z_][a-zA-Z0-9_]*/,
});

export const ExprLParen = createToken({
  name: "ExprLParen",
  pattern: /\(/,
});

export const ExprRParen = createToken({
  name: "ExprRParen",
  pattern: /\)/,
});

export const ExprPlus = createToken({
  name: "ExprPlus",
  pattern: /\+/,
});

export const ExprMinus = createToken({
  name: "ExprMinus",
  pattern: /-/,
});

export const ExprStar = createToken({
  name: "ExprStar",
  pattern: /\*/,
});

export const ExprSlash = createToken({
  name: "ExprSlash",
  pattern: /\//,
});

export const ExprComma = createToken({
  name: "ExprComma",
  pattern: /,/,
});

export const ExprWhitespace = createToken({
  group: Lexer.SKIPPED,
  name: "ExprWhitespace",
  pattern: /\s+/,
});

// conditional mode tokens

export const CondLBracket = createToken({
  name: "CondLBracket",
  pattern: /\[/,
  pop_mode: true,
  push_mode: "condBranch",
});

export const CondQuestion = createToken({
  name: "CondQuestion",
  pattern: /\?/,
});

export const CondPipe = createToken({
  name: "CondPipe",
  pattern: /\|/,
});

export const CondFuncCall = createToken({
  name: "CondFuncCall",
  pattern: /\$[a-zA-Z]+\([^)]*\)/,
});

export const CondType = createToken({
  name: "CondType",
  pattern: /[a-zA-Z]+\d*/,
});

// conditional branch mode tokens

export const BranchRBracket = createToken({
  name: "BranchRBracket",
  pattern: /\]/,
  pop_mode: true,
});

export const BranchLBracket = createToken({
  name: "BranchLBracket",
  pattern: /\[/,
  push_mode: "condBranch",
});

export const BranchExprBlockStart = createToken({
  name: "BranchExprBlockStart",
  pattern: /\$\{/,
  push_mode: "expression",
});

export const BranchCustomVar = createToken({
  name: "BranchCustomVar",
  pattern: /\$<[a-zA-Z][a-zA-Z0-9]*>/,
});

export const BranchAtVar = createToken({
  name: "BranchAtVar",
  pattern: /\$@[a-zA-Z]+\d*/,
});

export const BranchConditionalStart = createToken({
  name: "BranchConditionalStart",
  pattern: /\$\?/,
  push_mode: "conditional",
});

export const BranchPluralization = createToken({
  name: "BranchPluralization",
  pattern: /\$[lL][^:;\]]*:[^;\]]*;/,
});

export const BranchGender = createToken({
  name: "BranchGender",
  pattern: /\$[gG][^:;\]]*:[^;\]]*;/,
});

export const BranchCrossSpellRef = createToken({
  name: "BranchCrossSpellRef",
  pattern: /\$\d+[a-zA-Z]+\d*/,
});

export const BranchSimpleVar = createToken({
  name: "BranchSimpleVar",
  pattern: /\$[a-zA-Z_][a-zA-Z0-9_]*/,
});

export const BranchColorCode = createToken({
  name: "BranchColorCode",
  pattern: /\|[a-zA-Z][a-zA-Z0-9]*/,
});

export const BranchPipe = createToken({
  name: "BranchPipe",
  pattern: /\|/,
});

export const BranchText = createToken({
  name: "BranchText",
  pattern: /[^$|[\]]+/,
});

// complex patterns first in each mode
const defaultModeTokens = [
  ExpressionBlockStart,
  CustomVariable,
  EffectVariable,
  SpellLevelVariable,
  PlayerVariable,
  EnchantVariable,
  MiscVariable,
  AtVariable,
  ConditionalStart,
  Pluralization,
  Gender,
  CrossSpellRef,
  SimpleVariable,
  Dollar,
  ColorCode,
  Pipe,
  LBracket,
  RBracket,
  ChainCondQuestion,
  Text,
];

const expressionModeTokens = [
  ExpressionBlockEnd,
  ExprDecimalFormat,
  ExprCustomVar,
  ExprEffectVar,
  ExprSpellLevelVar,
  ExprPlayerVar,
  ExprEnchantVar,
  ExprMiscVar,
  ExprAtVar,
  ExprCrossSpellRef,
  ExprDollarFunc, // before ExprSimpleVar
  ExprSimpleVar,
  ExprNumber,
  ExprIdentifier,
  ExprLParen,
  ExprRParen,
  ExprPlus,
  ExprMinus,
  ExprStar,
  ExprSlash,
  ExprComma,
  ExprWhitespace,
];

const conditionalModeTokens = [
  CondLBracket,
  CondQuestion,
  CondPipe,
  CondFuncCall,
  CondType,
];

const condBranchModeTokens = [
  BranchRBracket,
  BranchLBracket,
  BranchExprBlockStart,
  BranchCustomVar,
  EffectVariable,
  SpellLevelVariable,
  PlayerVariable,
  EnchantVariable,
  MiscVariable,
  BranchAtVar,
  BranchConditionalStart,
  BranchPluralization,
  BranchGender,
  BranchCrossSpellRef,
  BranchSimpleVar,
  BranchColorCode,
  BranchPipe,
  BranchText,
];

export const multiModeLexerDefinition = {
  defaultMode: "default",
  modes: {
    condBranch: condBranchModeTokens,
    conditional: conditionalModeTokens,
    default: defaultModeTokens,
    expression: expressionModeTokens,
  },
};

export const allTokens = [
  ...defaultModeTokens,
  ...expressionModeTokens,
  ...conditionalModeTokens,
  ...condBranchModeTokens,
];

export const SpellDescriptionLexer = new Lexer(multiModeLexerDefinition, {
  ensureOptimizations: false,
});

export function tokenize(input: string) {
  return SpellDescriptionLexer.tokenize(input);
}
