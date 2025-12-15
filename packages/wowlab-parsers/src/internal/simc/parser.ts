import { CstParser } from "chevrotain";

import {
  allTokens,
  Comma,
  ComplexValue,
  Equals,
  Identifier,
  Integer,
  Newline,
  QuotedString,
  Slash,
  UnquotedValue,
} from "./lexer";

class SimcParser extends CstParser {
  private value = this.RULE("value", () => {
    this.OR([
      { ALT: () => this.CONSUME(QuotedString) },
      { ALT: () => this.CONSUME(ComplexValue) },
      { ALT: () => this.CONSUME(Integer) },
      { ALT: () => this.CONSUME(Identifier) },
      { ALT: () => this.CONSUME(UnquotedValue) },
    ]);
  });

  private assignment = this.RULE("assignment", () => {
    this.OR([
      {
        ALT: () => {
          this.CONSUME(Identifier, { LABEL: "key" });
          this.CONSUME(Equals);
          this.SUBRULE(this.value, { LABEL: "value" });
        },
      },
      {
        // fallback: complexvalue already contains key=value
        ALT: () => this.CONSUME(ComplexValue, { LABEL: "assignmentToken" }),
      },
    ]);
  });

  // bonus_id, gem_id use slash-separated lists
  private slashSeparatedList = this.RULE("slashSeparatedList", () => {
    this.SUBRULE(this.value, { LABEL: "values" });
    this.AT_LEAST_ONE(() => {
      this.CONSUME(Slash);
      this.SUBRULE2(this.value, { LABEL: "values" });
    });
  });

  private keyValuePair = this.RULE("keyValuePair", () => {
    this.OR([
      {
        ALT: () => {
          this.CONSUME(Identifier, { LABEL: "key" });
          this.CONSUME(Equals);
          this.OR1([
            { ALT: () => this.SUBRULE(this.slashSeparatedList) },
            { ALT: () => this.SUBRULE(this.value, { LABEL: "value" }) },
          ]);
        },
      },
      {
        // complex value already contains key=value
        ALT: () => this.CONSUME(ComplexValue, { LABEL: "kvToken" }),
      },
    ]);
  });

  // slot=,key=val,key=val,...
  private equipmentLine = this.RULE("equipmentLine", () => {
    this.CONSUME(Identifier, { LABEL: "slot" });
    this.CONSUME(Equals);
    this.CONSUME(Comma);
    this.OPTION(() => this.SUBRULE(this.keyValuePair));
    this.MANY(() => {
      this.CONSUME2(Comma);
      this.OPTION2(() => this.SUBRULE2(this.keyValuePair));
    });
  });

  private line = this.RULE("line", () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.equipmentLine) },
      { ALT: () => this.SUBRULE(this.assignment) },
    ]);
    this.OPTION(() => this.CONSUME(Newline));
  });

  public profile = this.RULE("profile", () => {
    this.MANY(() => {
      this.OR([
        { ALT: () => this.SUBRULE(this.line) },
        { ALT: () => this.CONSUME(Newline) },
      ]);
    });
  });

  constructor() {
    super(allTokens, {
      recoveryEnabled: true,
    });

    this.performSelfAnalysis();
  }
}

export const simcParser = new SimcParser();

export function parse(
  input: string,
  lexResult: ReturnType<typeof import("./lexer").tokenize>,
) {
  simcParser.input = lexResult.tokens;

  const cst = simcParser.profile();

  return {
    cst,
    errors: simcParser.errors,
    lexErrors: lexResult.errors,
  };
}
