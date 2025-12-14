import {
  parse,
  spellDescriptionParser,
  tokenize,
} from "@wowlab/parsers/SpellDescription";
import type { PlayerContext } from "@wowlab/parsers/SpellDescription";

import {
  capitalize,
  extractLeadingNumber,
  firstNode,
  firstTokenImage,
  formatNumber,
  getNodes,
  getTokenImages,
  getTokens,
  hasToken,
  isCstNode,
  splitArgs,
  type CstNode,
} from "./cst";
import type { SpellDbcData } from "./dbc";
import type { SpellDescriptionKind } from "./types";
import {
  isEffectVarType,
  isSpellLevelVarType,
  resolveEffectVariableFromSpell,
  resolveSpellLevelVariableFromSpell,
} from "./resolvers";

type EvalEnv = {
  readonly player: PlayerContext;
  readonly spellDataById: ReadonlyMap<number, SpellDbcData>;
  readonly renderNested: (
    spellId: number,
    kind: SpellDescriptionKind,
    depth: number,
    customVarStack: readonly string[],
  ) => string;
};

const BaseVisitor =
  spellDescriptionParser.getBaseCstVisitorConstructorWithDefaults();

export function renderWithEnv(
  env: EvalEnv,
  spellId: number,
  raw: string,
  depth: number,
  customVarStack: readonly string[],
): {
  readonly text: string;
  readonly errors: readonly unknown[];
  readonly lexErrors: readonly unknown[];
} {
  if (depth > 5) {
    return { errors: [], lexErrors: [], text: "" };
  }

  const lex = tokenize(raw);
  const parsed = parse("", lex);

  const root: unknown = parsed.cst;
  if (!isCstNode(root)) {
    return { errors: parsed.errors, lexErrors: parsed.lexErrors, text: raw };
  }

  const visitor = new SpellDescriptionEvalVisitor(
    env,
    spellId,
    depth,
    customVarStack,
  );
  const visited: unknown = visitor.visit(root);
  const text = typeof visited === "string" ? visited : raw;

  return { errors: parsed.errors, lexErrors: parsed.lexErrors, text };
}

export function buildEnv(
  spellDataById: ReadonlyMap<number, SpellDbcData>,
  player: PlayerContext,
): EvalEnv {
  const renderNested = (
    spellId: number,
    kind: SpellDescriptionKind,
    depth: number,
    customVarStack: readonly string[],
  ): string => {
    const row = spellDataById.get(spellId)?.spellRow;
    const raw =
      kind === "auraDescription"
        ? row?.AuraDescription_lang
        : row?.Description_lang;

    if (!raw) {
      return "";
    }

    return renderWithEnv(
      { player, renderNested, spellDataById },
      spellId,
      raw,
      depth,
      customVarStack,
    ).text;
  };

  return { player, renderNested, spellDataById };
}

class SpellDescriptionEvalVisitor extends BaseVisitor {
  private lastNumber: number | undefined;

  constructor(
    private readonly env: EvalEnv,
    private readonly currentSpellId: number,
    private readonly depth: number,
    private readonly customVarStack: readonly string[],
  ) {
    super();

    this.validateVisitor();
  }

  private visitAsString(node: CstNode): string {
    const value: unknown = this.visit(node);

    if (typeof value === "string") {
      return value;
    }

    return "";
  }

  private visitAsNumber(node: CstNode): number {
    const value: unknown = this.visit(node);

    if (typeof value === "number") {
      return value;
    }

    return 0;
  }

  private visitAsBoolean(node: CstNode): boolean {
    const value: unknown = this.visit(node);

    if (typeof value === "boolean") {
      return value;
    }

    return false;
  }

  description(ctx: Record<string, unknown>): string {
    return getNodes(ctx, "segment")
      .map((n) => this.visitAsString(n))
      .join("");
  }

  segment(ctx: Record<string, unknown>): string {
    const node = firstNode(ctx, "expressionBlock");
    if (node) {
      const value = this.visitAsNumber(node);
      this.lastNumber = value;

      return formatNumber(value);
    }

    const conditional = firstNode(ctx, "conditional");
    if (conditional) {
      return this.visitAsString(conditional);
    }

    const text = firstTokenImage(ctx, "Text");
    if (text != null) {
      return text;
    }

    const pluralization = firstTokenImage(ctx, "Pluralization");
    if (pluralization != null) {
      return this.renderPluralization(pluralization);
    }

    const gender = firstTokenImage(ctx, "Gender");
    if (gender != null) {
      return this.renderGender(gender);
    }

    const color = firstTokenImage(ctx, "ColorCode");
    if (color != null) {
      return "";
    }

    const customVar = firstTokenImage(ctx, "CustomVariable");
    if (customVar != null) {
      return this.renderCustomVariable(customVar);
    }

    const atVar = firstTokenImage(ctx, "AtVariable");
    if (atVar != null) {
      return this.renderAtVariable(atVar);
    }

    const crossRef = firstTokenImage(ctx, "CrossSpellRef");
    if (crossRef != null) {
      return this.renderCrossSpellReference(crossRef);
    }

    const effectVar = firstTokenImage(ctx, "EffectVariable");
    if (effectVar != null) {
      const value = this.resolveEffectVariable(effectVar);
      this.lastNumber = value;

      return formatNumber(value);
    }

    const spellLevelVar = firstTokenImage(ctx, "SpellLevelVariable");
    if (spellLevelVar != null) {
      const resolved = this.resolveSpellLevelVariable(spellLevelVar);

      if (typeof resolved === "number") {
        this.lastNumber = resolved;

        return formatNumber(resolved);
      }

      const num = extractLeadingNumber(resolved);
      if (num != null) {
        this.lastNumber = num;
      }

      return resolved;
    }

    const playerVar = firstTokenImage(ctx, "PlayerVariable");
    if (playerVar != null) {
      const value = this.resolvePlayerVariable(playerVar);
      this.lastNumber = value;

      return formatNumber(value);
    }

    const enchantVar = firstTokenImage(ctx, "EnchantVariable");
    if (enchantVar != null) {
      this.lastNumber = 0;

      return "0";
    }

    const miscVar = firstTokenImage(ctx, "MiscVariable");
    if (miscVar != null) {
      this.lastNumber = 0;

      return "0";
    }

    const simpleVar = firstTokenImage(ctx, "SimpleVariable");
    if (simpleVar != null) {
      return simpleVar;
    }

    const dollar = firstTokenImage(ctx, "Dollar");
    if (dollar != null) {
      return dollar;
    }

    const pipe = firstTokenImage(ctx, "Pipe");
    if (pipe != null) {
      return pipe;
    }

    const l = firstTokenImage(ctx, "LBracket");
    if (l != null) {
      return l;
    }

    const r = firstTokenImage(ctx, "RBracket");
    if (r != null) {
      return r;
    }

    return "";
  }

  expressionBlock(ctx: Record<string, unknown>): number {
    const expr = firstNode(ctx, "expression");
    if (!expr) {
      return 0;
    }

    return this.visitAsNumber(expr);
  }

  expression(ctx: Record<string, unknown>): number {
    const add = firstNode(ctx, "additiveExpression");
    if (!add) {
      return 0;
    }

    return this.visitAsNumber(add);
  }

  additiveExpression(ctx: Record<string, unknown>): number {
    const lhs = firstNode(ctx, "lhs");
    const rhsNodes = getNodes(ctx, "rhs");
    const ops = getTokens(ctx, "operator").map((t) => t.image);

    let value = lhs ? this.visitAsNumber(lhs) : 0;

    rhsNodes.forEach((rhs, i) => {
      const op = ops[i] ?? "+";
      const rhsValue = this.visitAsNumber(rhs);

      value = op === "-" ? value - rhsValue : value + rhsValue;
    });

    return value;
  }

  multiplicativeExpression(ctx: Record<string, unknown>): number {
    const lhs = firstNode(ctx, "lhs");
    const rhsNodes = getNodes(ctx, "rhs");
    const ops = getTokens(ctx, "operator").map((t) => t.image);

    let value = lhs ? this.visitAsNumber(lhs) : 0;

    rhsNodes.forEach((rhs, i) => {
      const op = ops[i] ?? "*";
      const rhsValue = this.visitAsNumber(rhs);

      value = op === "/" ? value / rhsValue : value * rhsValue;
    });

    return value;
  }

  unaryExpression(ctx: Record<string, unknown>): number {
    const atom = firstNode(ctx, "atomicExpression");
    const neg = firstTokenImage(ctx, "negation");
    const value = atom ? this.visitAsNumber(atom) : 0;

    return neg ? -value : value;
  }

  atomicExpression(ctx: Record<string, unknown>): number {
    const expr = firstNode(ctx, "expression");
    if (expr) {
      return this.visitAsNumber(expr);
    }

    const dollarFunc = firstNode(ctx, "dollarFunctionCall");
    if (dollarFunc) {
      return this.visitAsNumber(dollarFunc);
    }

    const func = firstNode(ctx, "functionCall");
    if (func) {
      return this.visitAsNumber(func);
    }

    const number = firstTokenImage(ctx, "ExprNumber");
    if (number != null) {
      return Number(number);
    }

    const effectVar = firstTokenImage(ctx, "ExprEffectVar");
    if (effectVar != null) {
      return this.resolveEffectVariable(effectVar);
    }

    const spellLevelVar = firstTokenImage(ctx, "ExprSpellLevelVar");
    if (spellLevelVar != null) {
      const resolved = this.resolveSpellLevelVariable(spellLevelVar);

      return typeof resolved === "number"
        ? resolved
        : (extractLeadingNumber(resolved) ?? 0);
    }

    const playerVar = firstTokenImage(ctx, "ExprPlayerVar");
    if (playerVar != null) {
      return this.resolvePlayerVariable(playerVar);
    }

    const atVar = firstTokenImage(ctx, "ExprAtVar");
    if (atVar != null) {
      return extractLeadingNumber(this.renderAtVariable(atVar)) ?? 0;
    }

    const crossRef = firstTokenImage(ctx, "ExprCrossSpellRef");
    if (crossRef != null) {
      return (
        extractLeadingNumber(this.renderCrossSpellReference(crossRef)) ?? 0
      );
    }

    const customVar = firstTokenImage(ctx, "ExprCustomVar");
    if (customVar != null) {
      const value = this.renderCustomVariable(customVar);
      return extractLeadingNumber(value) ?? 0;
    }

    const simpleVar = firstTokenImage(ctx, "ExprSimpleVar");
    if (simpleVar != null) {
      return 0;
    }

    return 0;
  }

  dollarFunctionCall(ctx: Record<string, unknown>): number {
    const name = firstTokenImage(ctx, "funcName") ?? "";
    const args = getNodes(ctx, "args").map((n) => this.visitAsNumber(n));
    const func = name.startsWith("$") ? name.slice(1) : name;

    switch (func) {
      case "gt":
        return (args[0] ?? 0) > (args[1] ?? 0) ? 1 : 0;

      case "gte":
        return (args[0] ?? 0) >= (args[1] ?? 0) ? 1 : 0;

      case "lt":
        return (args[0] ?? 0) < (args[1] ?? 0) ? 1 : 0;

      case "lte":
        return (args[0] ?? 0) <= (args[1] ?? 0) ? 1 : 0;

      case "max":
        return Math.max(args[0] ?? 0, args[1] ?? 0);

      case "min":
        return Math.min(args[0] ?? 0, args[1] ?? 0);

      case "clamp": {
        const v = args[0] ?? 0;
        const lo = args[1] ?? 0;
        const hi = args[2] ?? 0;

        return Math.min(hi, Math.max(lo, v));
      }
      case "floor":
        return Math.floor(args[0] ?? 0);

      case "cond":
        return (args[0] ?? 0) !== 0 ? (args[1] ?? 0) : (args[2] ?? 0);

      default:
        return 0;
    }
  }

  functionCall(ctx: Record<string, unknown>): number {
    const name = firstTokenImage(ctx, "funcName") ?? "";
    const args = getNodes(ctx, "args").map((n) => this.visitAsNumber(n));

    switch (name) {
      case "max":
        return Math.max(args[0] ?? 0, args[1] ?? 0);

      case "min":
        return Math.min(args[0] ?? 0, args[1] ?? 0);

      case "floor":
        return Math.floor(args[0] ?? 0);

      default:
        return 0;
    }
  }

  conditional(ctx: Record<string, unknown>): string {
    const predicates = getNodes(ctx, "conditionPredicate");
    const trueBranch = firstNode(ctx, "trueBranch");
    const chained = getNodes(ctx, "chainedBranch");
    const elseBranch = firstNode(ctx, "elseBranch");

    const pred0 = predicates[0] ? this.visitAsBoolean(predicates[0]) : false;
    if (pred0 && trueBranch) {
      return this.visitAsString(trueBranch);
    }

    for (let i = 1; i < predicates.length; i++) {
      const pred = this.visitAsBoolean(predicates[i]!);
      const branch = chained[i - 1];

      if (pred && branch) {
        return this.visitAsString(branch);
      }
    }

    if (elseBranch) {
      return this.visitAsString(elseBranch);
    }

    return "";
  }

  nestedConditional(ctx: Record<string, unknown>): string {
    const predicates = getNodes(ctx, "conditionPredicate");
    const trueBranch = firstNode(ctx, "trueBranch");
    const chained = getNodes(ctx, "chainedBranch");
    const elseBranch = firstNode(ctx, "elseBranch");

    const pred0 = predicates[0] ? this.visitAsBoolean(predicates[0]) : false;
    if (pred0 && trueBranch) {
      return this.visitAsString(trueBranch);
    }

    for (let i = 1; i < predicates.length; i++) {
      const pred = this.visitAsBoolean(predicates[i]!);
      const branch = chained[i - 1];

      if (pred && branch) {
        return this.visitAsString(branch);
      }
    }

    if (elseBranch) {
      return this.visitAsString(elseBranch);
    }

    return "";
  }

  elseBranch(ctx: Record<string, unknown>): string {
    return getNodes(ctx, "branchContent")
      .map((n) => this.visitAsString(n))
      .join("");
  }

  conditionalBranch(ctx: Record<string, unknown>): string {
    return getNodes(ctx, "branchContent").map((n) => this.visitAsString(n)).join("");
  }

  nestedBrackets(ctx: Record<string, unknown>): string {
    return getNodes(ctx, "branchContent").map((n) => this.visitAsString(n)).join("");
  }

  branchContent(ctx: Record<string, unknown>): string {
    const expr = firstNode(ctx, "expression");
    if (expr && hasToken(ctx, "BranchExprBlockStart")) {
      const value = this.visitAsNumber(expr);
      this.lastNumber = value;

      return formatNumber(value);
    }

    const nested = firstNode(ctx, "nestedConditional");
    if (nested) {
      return this.visitAsString(nested);
    }

    const brackets = firstNode(ctx, "nestedBrackets");
    if (brackets) {
      return this.visitAsString(brackets);
    }

    const text = firstTokenImage(ctx, "BranchText");
    if (text != null) {
      return text;
    }

    const pluralization = firstTokenImage(ctx, "BranchPluralization");
    if (pluralization != null) {
      return this.renderPluralization(pluralization);
    }

    const gender = firstTokenImage(ctx, "BranchGender");
    if (gender != null) {
      return this.renderGender(gender);
    }

    const color = firstTokenImage(ctx, "BranchColorCode");
    if (color != null) {
      return "";
    }

    const customVar = firstTokenImage(ctx, "BranchCustomVar");
    if (customVar != null) {
      return this.renderCustomVariable(customVar);
    }

    const atVar = firstTokenImage(ctx, "BranchAtVar");
    if (atVar != null) {
      return this.renderAtVariable(atVar);
    }

    const crossRef = firstTokenImage(ctx, "BranchCrossSpellRef");
    if (crossRef != null) {
      return this.renderCrossSpellReference(crossRef);
    }

    const effectVar = firstTokenImage(ctx, "EffectVariable");
    if (effectVar != null) {
      const value = this.resolveEffectVariable(effectVar);
      this.lastNumber = value;

      return formatNumber(value);
    }

    const spellLevelVar = firstTokenImage(ctx, "SpellLevelVariable");
    if (spellLevelVar != null) {
      const resolved = this.resolveSpellLevelVariable(spellLevelVar);
      if (typeof resolved === "number") {
        this.lastNumber = resolved;
        
        return formatNumber(resolved);
      }

      const num = extractLeadingNumber(resolved);
      if (num != null) {
        this.lastNumber = num;
      }

      return resolved;
    }

    const playerVar = firstTokenImage(ctx, "PlayerVariable");
    if (playerVar != null) {
      const value = this.resolvePlayerVariable(playerVar);
      this.lastNumber = value;

      return formatNumber(value);
    }

    const enchantVar = firstTokenImage(ctx, "EnchantVariable");
    if (enchantVar != null) {
      this.lastNumber = 0;

      return "0";
    }

    const miscVar = firstTokenImage(ctx, "MiscVariable");
    if (miscVar != null) {
      this.lastNumber = 0;

      return "0";
    }

    const simpleVar = firstTokenImage(ctx, "BranchSimpleVar");
    if (simpleVar != null) {
      return simpleVar;
    }

    const pipe = firstTokenImage(ctx, "BranchPipe");
    if (pipe != null) {
      return pipe;
    }

    return "";
  }

  conditionPredicate(ctx: Record<string, unknown>): boolean {
    const first =
      firstTokenImage(ctx, "funcCall") ?? firstTokenImage(ctx, "condType");

    const others = [
      ...getTokenImages(ctx, "orFuncCall"),
      ...getTokenImages(ctx, "orCondType"),
    ];

    const all = [first, ...others].filter((x): x is string => x != null);

    return all.some((cond) => this.evalConditionAtom(cond));
  }

  private evalConditionAtom(cond: string): boolean {
    if (cond.startsWith("$")) {
      const match = cond.match(/^\$([a-zA-Z]+)\((.*)\)$/);
      if (!match) {
        return false;
      }

      const func = match[1] ?? "";
      const argsText = match[2] ?? "";
      const args = splitArgs(argsText).map((a) => this.evalExpressionString(a));

      switch (func) {
        case "gt":
          return (args[0] ?? 0) > (args[1] ?? 0);

        case "gte":
          return (args[0] ?? 0) >= (args[1] ?? 0);

        case "lt":
          return (args[0] ?? 0) < (args[1] ?? 0);

        case "lte":
          return (args[0] ?? 0) <= (args[1] ?? 0);

        default:
          return false;
      }
    }

    const idDigits = cond.match(/\d+$/)?.[0] ?? "";
    const id = idDigits ? Number(idDigits) : 0;
    const prefix = idDigits ? cond.slice(0, -idDigits.length) : cond;

    switch (prefix) {
      case "s":
        return this.env.player.knownSpells.has(id);

      case "a":
        return this.env.player.activeAuras.has(id);

      case "c":
        return this.env.player.classId === id;

      case "pc":
        return false;

      default:
        return false;
    }
  }

  private evalExpressionString(expr: string): number {
    const wrapped = "${" + expr + "}";
    const lex = tokenize(wrapped);
    const parsed = parse("", lex);
    const root: unknown = parsed.cst;

    if (!isCstNode(root)) {
      return 0;
    }

    const segment = root.children.segment;
    if (!Array.isArray(segment) || segment.length === 0) {
      return 0;
    }

    const seg = segment[0];
    if (!isCstNode(seg)) {
      return 0;
    }

    const exprBlock = firstNode(seg.children, "expressionBlock");
    if (!exprBlock) {
      return 0;
    }

    return this.visitAsNumber(exprBlock);
  }

  private renderCustomVariable(image: string): string {
    const name = image.slice(2, -1);
    if (this.customVarStack.includes(name)) {
      return "";
    }

    const spellData = this.env.spellDataById.get(this.currentSpellId);
    const value = spellData?.customVariables.get(name);

    if (!value) {
      return "";
    }

    const text = renderWithEnv(
      this.env,
      this.currentSpellId,
      value,
      this.depth + 1,
      [...this.customVarStack, name],
    ).text;

    const num = extractLeadingNumber(text);
    if (num != null) {
      this.lastNumber = num;
    }

    return text;
  }

  private renderAtVariable(image: string): string {
    const body = image.slice(2);
    const tailDigits = body.match(/\d+$/)?.[0];
    const spellId = tailDigits ? Number(tailDigits) : this.currentSpellId;
    const varType = tailDigits ? body.slice(0, -tailDigits.length) : body;

    if (varType === "spellname") {
      return this.env.spellDataById.get(spellId)?.spellNameRow?.Name_lang ?? "";
    }

    if (varType === "spelldesc") {
      return this.env.renderNested(
        spellId,
        "description",
        this.depth + 1,
        this.customVarStack,
      );
    }

    if (varType === "spellaura") {
      return this.env.renderNested(
        spellId,
        "auraDescription",
        this.depth + 1,
        this.customVarStack,
      );
    }

    if (varType === "versadmg") {
      return formatNumber(this.env.player.versatilityDamageBonus);
    }

    return "";
  }

  private renderCrossSpellReference(image: string): string {
    const body = image.slice(1);
    const idDigits = body.match(/^\d+/)?.[0] ?? "";
    const remainder = body.slice(idDigits.length);
    const trail = remainder.match(/\d+$/)?.[0];
    const varType = trail ? remainder.slice(0, -trail.length) : remainder;
    const effectIndex = trail ? Number(trail) : undefined;
    const spellId = Number(idDigits);

    return this.resolveVariableForSpell(spellId, varType, effectIndex);
  }

  private resolveVariableForSpell(
    spellId: number,
    varType: string,
    effectIndex?: number,
  ): string {
    const spellData = this.env.spellDataById.get(spellId);
    if (!spellData) {
      return "";
    }

    if (isEffectVarType(varType)) {
      const value = resolveEffectVariableFromSpell(
        spellData,
        "$" + varType + String(effectIndex ?? 1),
      );
      this.lastNumber = value;

      return formatNumber(value);
    }

    if (isSpellLevelVarType(varType)) {
      const resolved = resolveSpellLevelVariableFromSpell(
        spellData,
        "$" + varType + (effectIndex != null ? String(effectIndex) : ""),
      );

      if (typeof resolved === "number") {
        this.lastNumber = resolved;
        return formatNumber(resolved);
      }

      const num = extractLeadingNumber(resolved);
      if (num != null) {
        this.lastNumber = num;
      }

      return resolved;
    }

    return "";
  }

  private resolveEffectVariable(image: string): number {
    const spellData = this.env.spellDataById.get(this.currentSpellId);
    if (!spellData) {
      return 0;
    }

    return resolveEffectVariableFromSpell(spellData, image);
  }

  private resolveSpellLevelVariable(image: string): number | string {
    const spellData = this.env.spellDataById.get(this.currentSpellId);
    if (!spellData) {
      return 0;
    }

    return resolveSpellLevelVariableFromSpell(spellData, image);
  }

  private resolvePlayerVariable(image: string): number {
    const name = image.slice(1);

    switch (name) {
      case "SP":
      case "sp":
        return this.env.player.spellPower;

      case "AP":
      case "ap":
        return this.env.player.attackPower;

      case "RAP":
        return this.env.player.rangedAttackPower;

      case "MHP":
      case "mhp":
        return this.env.player.maxHealth;

      case "PL":
      case "pl":
        return this.env.player.level;

      case "INT":
        return this.env.player.intellect;

      case "SPS":
        return this.env.player.spellPower;
        
      default:
        return 0;
    }
  }

  private renderPluralization(image: string): string {
    const capitalized = image[1] === "L";
    const body = image.slice(2, -1);
    const [singular = "", plural = ""] = body.split(":");
    const word = this.lastNumber === 1 ? singular : plural;

    return capitalized ? capitalize(word) : word;
  }

  private renderGender(image: string): string {
    const capitalized = image[1] === "G";
    const body = image.slice(2, -1);
    const [male = "", female = ""] = body.split(":");
    const word = this.env.player.gender === "female" ? female : male;

    return capitalized ? capitalize(word) : word;
  }
}
