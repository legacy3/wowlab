import { CstParser } from "chevrotain";

import {
  allTokens,
  AtVariable,
  BranchAtVar,
  BranchColorCode,
  BranchConditionalStart,
  BranchCrossSpellRef,
  BranchCustomVar,
  BranchExprBlockStart,
  BranchGender,
  BranchLBracket,
  BranchPipe,
  BranchPluralization,
  BranchRBracket,
  BranchSimpleVar,
  BranchText,
  ChainCondQuestion,
  ColorCode,
  CondFuncCall,
  ConditionalStart,
  CondLBracket,
  CondPipe,
  CondQuestion,
  CondType,
  CrossSpellRef,
  CustomVariable,
  Dollar,
  ExprAtVar,
  ExprComma,
  ExprCrossSpellRef,
  ExprCustomVar,
  ExprDollarFunc,
  ExpressionBlockEnd,
  ExpressionBlockStart,
  ExprIdentifier,
  ExprLParen,
  ExprMinus,
  ExprNumber,
  ExprPlus,
  ExprRParen,
  ExprSimpleVar,
  ExprSlash,
  ExprStar,
  Gender,
  LBracket,
  Pipe,
  Pluralization,
  RBracket,
  SimpleVariable,
  Text,
} from "./lexer";

class SpellDescriptionParser extends CstParser {
  private conditionPredicate = this.RULE("conditionPredicate", () => {
    this.OR([
      { ALT: () => this.CONSUME(CondFuncCall, { LABEL: "funcCall" }) },
      { ALT: () => this.CONSUME(CondType, { LABEL: "condType" }) },
    ]);
    // or conditions: |a123|s456
    this.MANY(() => {
      this.CONSUME(CondPipe);
      this.OR2([
        { ALT: () => this.CONSUME2(CondFuncCall, { LABEL: "orFuncCall" }) },
        { ALT: () => this.CONSUME2(CondType, { LABEL: "orCondType" }) },
      ]);
    });
  });

  private elseBranch = this.RULE("elseBranch", () => {
    this.CONSUME(LBracket);
    this.MANY(() => {
      this.SUBRULE(this.branchContent);
    });
    this.CONSUME(BranchRBracket);
  });

  private conditional = this.RULE("conditional", () => {
    this.CONSUME(ConditionalStart);
    this.SUBRULE(this.conditionPredicate);
    this.SUBRULE(this.conditionalBranch, { LABEL: "trueBranch" });
    this.MANY(() => {
      this.OR([
        {
          // chained: ?a123[text]
          ALT: () => {
            this.CONSUME(ChainCondQuestion);
            this.SUBRULE2(this.conditionPredicate);
            this.SUBRULE2(this.conditionalBranch, { LABEL: "chainedBranch" });
          },
        },
        {
          ALT: () => this.SUBRULE(this.elseBranch, { LABEL: "elseBranch" }),
        },
      ]);
    });
  });

  private expressionBlock = this.RULE("expressionBlock", () => {
    this.CONSUME(ExpressionBlockStart);
    this.SUBRULE(this.expression);
    this.CONSUME(ExpressionBlockEnd);
  });

  private segment = this.RULE("segment", () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.expressionBlock) },
      { ALT: () => this.CONSUME(CustomVariable) },
      { ALT: () => this.CONSUME(AtVariable) },
      { ALT: () => this.SUBRULE(this.conditional) },
      { ALT: () => this.CONSUME(Pluralization) },
      { ALT: () => this.CONSUME(Gender) },
      { ALT: () => this.CONSUME(CrossSpellRef) },
      { ALT: () => this.CONSUME(SimpleVariable) },
      { ALT: () => this.CONSUME(Dollar) },
      { ALT: () => this.CONSUME(ColorCode) },
      { ALT: () => this.CONSUME(Pipe) },
      { ALT: () => this.CONSUME(LBracket) },
      { ALT: () => this.CONSUME(RBracket) },
      { ALT: () => this.CONSUME(Text) },
    ]);
  });

  public description = this.RULE("description", () => {
    this.MANY(() => {
      this.SUBRULE(this.segment);
    });
  });

  private additiveExpression = this.RULE("additiveExpression", () => {
    this.SUBRULE(this.multiplicativeExpression, { LABEL: "lhs" });
    this.MANY(() => {
      this.OR([
        { ALT: () => this.CONSUME(ExprPlus, { LABEL: "operator" }) },
        { ALT: () => this.CONSUME(ExprMinus, { LABEL: "operator" }) },
      ]);
      this.SUBRULE2(this.multiplicativeExpression, { LABEL: "rhs" });
    });
  });

  private atomicExpression = this.RULE("atomicExpression", () => {
    this.OR([
      {
        ALT: () => {
          this.CONSUME(ExprLParen);
          this.SUBRULE(this.expression);
          this.CONSUME(ExprRParen);
        },
      },
      { ALT: () => this.SUBRULE(this.dollarFunctionCall) },
      { ALT: () => this.SUBRULE(this.functionCall) },
      { ALT: () => this.CONSUME(ExprCustomVar) },
      { ALT: () => this.CONSUME(ExprAtVar) },
      { ALT: () => this.CONSUME(ExprCrossSpellRef) },
      { ALT: () => this.CONSUME(ExprSimpleVar) },
      { ALT: () => this.CONSUME(ExprNumber) },
    ]);
  });

  private branchContent = this.RULE("branchContent", () => {
    this.OR([
      {
        ALT: () => {
          this.CONSUME(BranchExprBlockStart);
          this.SUBRULE(this.expression);
          this.CONSUME(ExpressionBlockEnd);
        },
      },
      { ALT: () => this.CONSUME(BranchCustomVar) },
      { ALT: () => this.CONSUME(BranchAtVar) },
      { ALT: () => this.SUBRULE(this.nestedConditional) },
      { ALT: () => this.CONSUME(BranchPluralization) },
      { ALT: () => this.CONSUME(BranchGender) },
      { ALT: () => this.CONSUME(BranchCrossSpellRef) },
      { ALT: () => this.CONSUME(BranchSimpleVar) },
      { ALT: () => this.CONSUME(BranchColorCode) },
      { ALT: () => this.CONSUME(BranchPipe) },
      { ALT: () => this.SUBRULE(this.nestedBrackets) },
      { ALT: () => this.CONSUME(BranchText) },
    ]);
  });

  private conditionalBranch = this.RULE("conditionalBranch", () => {
    this.CONSUME(CondLBracket);
    this.MANY(() => {
      this.SUBRULE(this.branchContent);
    });
    this.CONSUME(BranchRBracket);
  });

  private dollarFunctionCall = this.RULE("dollarFunctionCall", () => {
    this.CONSUME(ExprDollarFunc, { LABEL: "funcName" });
    this.CONSUME(ExprLParen);
    this.OPTION(() => {
      this.SUBRULE(this.expression, { LABEL: "args" });
      this.MANY(() => {
        this.CONSUME(ExprComma);
        this.SUBRULE2(this.expression, { LABEL: "args" });
      });
    });
    this.CONSUME(ExprRParen);
  });

  private expression = this.RULE("expression", () => {
    this.SUBRULE(this.additiveExpression);
  });

  private functionCall = this.RULE("functionCall", () => {
    this.CONSUME(ExprIdentifier, { LABEL: "funcName" });
    this.CONSUME(ExprLParen);
    this.OPTION(() => {
      this.SUBRULE(this.expression, { LABEL: "args" });
      this.MANY(() => {
        this.CONSUME(ExprComma);
        this.SUBRULE2(this.expression, { LABEL: "args" });
      });
    });
    this.CONSUME(ExprRParen);
  });

  private multiplicativeExpression = this.RULE(
    "multiplicativeExpression",
    () => {
      this.SUBRULE(this.unaryExpression, { LABEL: "lhs" });
      this.MANY(() => {
        this.OR([
          { ALT: () => this.CONSUME(ExprStar, { LABEL: "operator" }) },
          { ALT: () => this.CONSUME(ExprSlash, { LABEL: "operator" }) },
        ]);
        this.SUBRULE2(this.unaryExpression, { LABEL: "rhs" });
      });
    },
  );

  private nestedBrackets = this.RULE("nestedBrackets", () => {
    this.CONSUME(BranchLBracket);
    this.MANY(() => {
      this.SUBRULE(this.branchContent);
    });
    this.CONSUME(BranchRBracket);
  });

  private nestedConditional = this.RULE("nestedConditional", () => {
    this.CONSUME(BranchConditionalStart);
    this.SUBRULE(this.conditionPredicate);
    this.SUBRULE(this.conditionalBranch, { LABEL: "trueBranch" });
    this.MANY(() => {
      this.OR([
        {
          ALT: () => {
            this.CONSUME(CondQuestion);
            this.SUBRULE2(this.conditionPredicate);
            this.SUBRULE2(this.conditionalBranch, { LABEL: "chainedBranch" });
          },
        },
        {
          ALT: () => {
            this.SUBRULE3(this.conditionalBranch, { LABEL: "elseBranch" });
          },
        },
      ]);
    });
  });

  private unaryExpression = this.RULE("unaryExpression", () => {
    this.OPTION(() => {
      this.CONSUME(ExprMinus, { LABEL: "negation" });
    });
    this.SUBRULE(this.atomicExpression);
  });

  constructor() {
    super(allTokens, {
      maxLookahead: 3,
      recoveryEnabled: true,
    });

    this.performSelfAnalysis();
  }
}

export const spellDescriptionParser = new SpellDescriptionParser();

export function parse(
  _input: string,
  lexResult: ReturnType<typeof import("./lexer").tokenize>,
) {
  spellDescriptionParser.input = lexResult.tokens;

  const cst = spellDescriptionParser.description();

  return {
    cst,
    errors: spellDescriptionParser.errors,
    lexErrors: lexResult.errors,
  };
}
