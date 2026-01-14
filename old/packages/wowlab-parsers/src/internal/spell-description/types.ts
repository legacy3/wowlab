export interface AtVariableNode {
  readonly spellId?: number;
  readonly type: "atVariable";
  readonly varType: string; // spelldesc, spellname, spellaura, versadmg, etc
}

export interface AuraConditionNode {
  readonly auraId: number;
  readonly type: "auraCondition";
}

export interface BinaryExpressionNode {
  readonly left: ExpressionNode;
  readonly operator: "+" | "-" | "*" | "/";
  readonly right: ExpressionNode;
  readonly type: "binaryExpression";
}

export interface ClassConditionNode {
  readonly classId: number;
  readonly type: "classCondition";
}

export interface ColorCodeNode {
  readonly code: string;
  readonly type: "colorCode";
}

export interface ConditionalBranchNode {
  readonly content: readonly SpellDescriptionNode[];
  readonly predicate: ConditionalPredicateNode;
  readonly type: "conditionalBranch";
}

export interface ConditionalNode {
  readonly conditions: readonly ConditionalBranchNode[];
  readonly elseBranch?: readonly SpellDescriptionNode[];
  readonly type: "conditional";
}

export interface ConditionalPredicateNode {
  readonly conditions: readonly SingleConditionNode[]; // or'd together
  readonly type: "conditionalPredicate";
}

export interface CrossSpellReferenceNode {
  readonly effectIndex?: number;
  readonly spellId: number;
  readonly type: "crossSpellReference";
  readonly varType: string; // s, m, d, t, o, a, bc, h, u, i
}

export interface CustomVariableNode {
  readonly type: "customVariable";
  readonly varName: string;
}

export interface DescriptionVariables {
  readonly [key: string]: string;
}

export interface EffectVariableNode {
  readonly effectIndex: number; // 1-9
  readonly type: "effectVariable";
  readonly varType: string; // s, m, M, o, t, a, A, e, w, x, bc, q
}

export interface EnchantVariableNode {
  readonly type: "enchantVariable";
  readonly varType: string; // ec1, ecix, ecd
}

export interface ExpressionBlockNode {
  readonly decimalPlaces?: number;
  readonly expression: ExpressionNode;
  readonly type: "expressionBlock";
}

export interface ExpressionConditionNode {
  readonly args: readonly ExpressionNode[];
  readonly funcName: string;
  readonly type: "expressionCondition";
}

export type ExpressionNode =
  | BinaryExpressionNode
  | UnaryExpressionNode
  | FunctionCallNode
  | VariableNode
  | NumberLiteralNode
  | ParenExpressionNode;

export interface FunctionCallNode {
  readonly args: readonly ExpressionNode[];
  readonly funcName: string; // gt, gte, lt, lte, cond, max, min, clamp, floor
  readonly type: "functionCall";
}

export interface GenderNode {
  readonly capitalized: boolean;
  readonly female: string;
  readonly male: string;
  readonly type: "gender";
}

export interface MiscVariableNode {
  readonly id?: number;
  readonly type: "miscVariable";
  readonly varName: string; // maxcast, pctD, W, W2, B, ctrmax
}

export interface NumberLiteralNode {
  readonly type: "numberLiteral";
  readonly value: number;
}

export interface ParenExpressionNode {
  readonly expression: ExpressionNode;
  readonly type: "parenExpression";
}

export interface ParsedSpellDescription {
  readonly nodes: readonly SpellDescriptionNode[];
}

export interface PlayerConditionNode {
  readonly conditionId: number;
  readonly type: "playerCondition";
}

export interface PlayerContext {
  readonly activeAuras: ReadonlySet<number>;
  readonly attackPower: number;
  readonly classId: number;
  readonly gender: "male" | "female";
  readonly intellect: number;
  readonly knownSpells: ReadonlySet<number>;
  readonly level: number;
  readonly maxHealth: number;
  readonly rangedAttackPower: number;
  readonly spellPower: number;
  readonly versatilityDamageBonus: number;
}

export interface PlayerVariableNode {
  readonly type: "playerVariable";
  readonly varName: string; // SP, sp, AP, ap, RAP, MHP, mhp, SPS, PL, pl, INT
}

export interface PluralizationNode {
  readonly capitalized: boolean;
  readonly plural: string;
  readonly singular: string;
  readonly type: "pluralization";
}

export interface ResolutionContext {
  readonly customVariables: DescriptionVariables;
  readonly getRadiusValue: (radiusIndex: number) => number | undefined;
  readonly getSpell: (spellId: number) => SpellData | undefined;
  readonly getSpellDescription: (spellId: number) => string | undefined;
  readonly getSpellName: (spellId: number) => string | undefined;
  readonly player: PlayerContext;
  readonly spell: SpellData;
}

export type SingleConditionNode =
  | SpellKnownConditionNode
  | AuraConditionNode
  | ClassConditionNode
  | PlayerConditionNode
  | ExpressionConditionNode;

export interface SpellData {
  readonly durationMs: number;
  readonly effects: readonly SpellEffectData[];
  readonly id: number;
  readonly maxStacks: number;
  readonly maxTargets: number;
  readonly procChance: number;
  readonly procCharges: number;
  readonly rangeYards: number;
}

export type SpellDescriptionNode =
  | TextNode
  | VariableNode
  | ExpressionBlockNode
  | ConditionalNode
  | PluralizationNode
  | GenderNode
  | ColorCodeNode;

export interface SpellEffectData {
  readonly amplitude: number;
  readonly auraPeriod: number;
  readonly basePoints: number;
  readonly bonusCoefficient: number;
  readonly chainTargets: number;
  readonly miscValue: number;
  readonly pointsPerResource: number;
  readonly radiusIndex: number;
}

export interface SpellKnownConditionNode {
  readonly spellId: number;
  readonly type: "spellKnownCondition";
}

export interface SpellLevelVariableNode {
  readonly index?: number;
  readonly type: "spellLevelVariable";
  readonly varType: string; // d, n, u, h, r, i, p, z, c
}

export interface TextNode {
  readonly type: "text";
  readonly value: string;
}

export interface UnaryExpressionNode {
  readonly operand: ExpressionNode;
  readonly operator: "-";
  readonly type: "unaryExpression";
}

export type VariableNode =
  | EffectVariableNode
  | SpellLevelVariableNode
  | CrossSpellReferenceNode
  | PlayerVariableNode
  | CustomVariableNode
  | AtVariableNode
  | EnchantVariableNode
  | MiscVariableNode;
