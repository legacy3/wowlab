import type {
  AtVariableNode,
  ColorCodeNode,
  CrossSpellReferenceNode,
  CustomVariableNode,
  EffectVariableNode,
  EnchantVariableNode,
  GenderNode,
  MiscVariableNode,
  ParsedSpellDescription,
  PlayerVariableNode,
  PluralizationNode,
  SpellDescriptionNode,
  SpellLevelVariableNode,
  TextNode,
} from "./types";

import { tokenize } from "./lexer";
import { spellDescriptionParser } from "./parser";

const textNode = (value: string): TextNode => ({ type: "text", value });

const effectVarFrom = (image: string): EffectVariableNode => {
  const body = image.slice(1);
  const index = Number(body.slice(-1));
  const varType = body.slice(0, -1);

  return { effectIndex: index, type: "effectVariable", varType };
};

const spellLevelVarFrom = (image: string): SpellLevelVariableNode => {
  const body = image.slice(1);
  const maybeIndex = Number(body.slice(-1));
  const hasIndex = !Number.isNaN(maybeIndex) && body.length > 1;

  return {
    index: hasIndex ? maybeIndex : undefined,
    type: "spellLevelVariable",
    varType: hasIndex ? body.slice(0, -1) : body,
  };
};

const playerVarFrom = (image: string): PlayerVariableNode => ({
  type: "playerVariable",
  varName: image.slice(1) as PlayerVariableNode["varName"],
});

const enchantVarFrom = (image: string): EnchantVariableNode => ({
  type: "enchantVariable",
  varType: image.slice(1),
});

const miscVarFrom = (image: string): MiscVariableNode => ({
  type: "miscVariable",
  varName: image.slice(1),
});

const pluralizationFrom = (image: string): PluralizationNode => {
  const capitalized = image[1] === "L";
  const body = image.slice(2, -1);
  const [singular = "", plural = ""] = body.split(":");

  return { capitalized, plural, singular, type: "pluralization" };
};

const genderFrom = (image: string): GenderNode => {
  const capitalized = image[1] === "G";
  const body = image.slice(2, -1);
  const [male = "", female = ""] = body.split(":");

  return { capitalized, female, male, type: "gender" };
};

const atVarFrom = (image: string): AtVariableNode => {
  const body = image.slice(2);
  const tailDigits = body.match(/\d+$/)?.[0];
  const spellId = tailDigits ? Number(tailDigits) : undefined;
  const varType = tailDigits ? body.slice(0, -tailDigits.length) : body;

  return { spellId, type: "atVariable", varType };
};

const customVarFrom = (image: string): CustomVariableNode => ({
  type: "customVariable",
  varName: image.slice(2, -1),
});

const crossRefFrom = (image: string): CrossSpellReferenceNode => {
  const body = image.slice(1);
  const idDigits = body.match(/^\d+/)?.[0] ?? "";
  const remainder = body.slice(idDigits.length);
  const trail = remainder.match(/\d+$/)?.[0];
  const varType = trail ? remainder.slice(0, -trail.length) : remainder;
  const effectIndex = trail ? Number(trail) : undefined;

  return {
    effectIndex,
    spellId: Number(idDigits),
    type: "crossSpellReference",
    varType,
  };
};

const colorFrom = (image: string): ColorCodeNode => ({
  code: image.slice(1),
  type: "colorCode",
});

export function visitSpellDescription(input: string): {
  ast: ParsedSpellDescription;
  errors: readonly unknown[];
  lexErrors: readonly unknown[];
} {
  const lexResult = tokenize(input);
  spellDescriptionParser.input = lexResult.tokens;
  spellDescriptionParser.description();

  const nodes = lexResult.tokens.map(tokenToNode);

  return {
    ast: { nodes },
    errors: spellDescriptionParser.errors,
    lexErrors: lexResult.errors,
  };
}

function tokenToNode(
  tok: (typeof spellDescriptionParser.input)[number],
): SpellDescriptionNode {
  switch (tok.tokenType.name) {
    case "AtVariable":
    case "BranchAtVar":
    case "ExprAtVar":
      return atVarFrom(tok.image);

    case "BranchColorCode":
    case "ColorCode":
      return colorFrom(tok.image);

    case "BranchCrossSpellRef":
    case "CrossSpellRef":
    case "ExprCrossSpellRef":
      return crossRefFrom(tok.image);

    case "BranchCustomVar":
    case "CustomVariable":
    case "ExprCustomVar":
      return customVarFrom(tok.image);

    case "BranchGender":
    case "Gender":
      return genderFrom(tok.image);

    case "BranchPluralization":
    case "Pluralization":
      return pluralizationFrom(tok.image);

    case "BranchText":
    case "Text":
      return textNode(tok.image);

    case "EffectVariable":
    case "ExprEffectVar":
      return effectVarFrom(tok.image);

    case "EnchantVariable":
    case "ExprEnchantVar":
      return enchantVarFrom(tok.image);

    case "ExprMiscVar":
    case "MiscVariable":
      return miscVarFrom(tok.image);

    case "ExprPlayerVar":
    case "PlayerVariable":
      return playerVarFrom(tok.image);

    case "ExprSpellLevelVar":
    case "SpellLevelVariable":
      return spellLevelVarFrom(tok.image);

    default:
      return textNode(tok.image);
  }
}
