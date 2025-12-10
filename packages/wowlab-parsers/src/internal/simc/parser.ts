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

// -----------------------------------------------------------------------------
// Parser Definition
// -----------------------------------------------------------------------------

class SimcParser extends CstParser {
  // A value can be a quoted string, complex value, integer, or identifier
  private value = this.RULE("value", () => {
    this.OR([
      { ALT: () => this.CONSUME(QuotedString) },
      { ALT: () => this.CONSUME(ComplexValue) },
      { ALT: () => this.CONSUME(Integer) },
      { ALT: () => this.CONSUME(Identifier) },
      { ALT: () => this.CONSUME(UnquotedValue) },
    ]);
  });

  // Simple assignment: identifier=value
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
        ALT: () => {
          // Fallback: single ComplexValue token containing key=value
          this.CONSUME(ComplexValue, { LABEL: "assignmentToken" });
        },
      },
    ]);
  });

  // Slash-separated list: value/value/value (for bonus_id, gem_id)
  private slashSeparatedList = this.RULE("slashSeparatedList", () => {
    this.SUBRULE(this.value, { LABEL: "values" });
    this.AT_LEAST_ONE(() => {
      this.CONSUME(Slash);
      this.SUBRULE2(this.value, { LABEL: "values" });
    });
  });

  // Key-value pair within equipment line
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
        ALT: () => {
          // Fallback: a single ComplexValue token that already contains key=value
          this.CONSUME(ComplexValue, { LABEL: "kvToken" });
        },
      },
    ]);
  });

  // Equipment line: identifier=,keyValue,keyValue,...
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

  // A line is either an equipment line or a simple assignment
  private line = this.RULE("line", () => {
    this.OR([
      // Equipment line: slot=,key=val,key=val
      { ALT: () => this.SUBRULE(this.equipmentLine) },
      // Simple assignment: key=value
      { ALT: () => this.SUBRULE(this.assignment) },
    ]);

    // Consume optional trailing newline
    this.OPTION(() => this.CONSUME(Newline));
  });

  // Entry point: a profile is a sequence of lines
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
