import { createToken, Lexer } from "chevrotain";

// -----------------------------------------------------------------------------
// Token Definitions
// -----------------------------------------------------------------------------

// Comments - must come early to catch # lines before other tokens
export const Comment = createToken({
  group: Lexer.SKIPPED,
  line_breaks: false,
  name: "Comment",
  pattern: /#[^\n\r]*/,
});

// Whitespace within a line (not newlines)
export const WhiteSpace = createToken({
  group: Lexer.SKIPPED,
  name: "WhiteSpace",
  pattern: /[ \t]+/,
});

// Newlines are significant for line-based parsing
export const Newline = createToken({
  line_breaks: true,
  name: "Newline",
  pattern: /\r?\n/,
});

// Operators
export const Equals = createToken({ name: "Equals", pattern: /=/ });
export const Comma = createToken({ name: "Comma", pattern: /,/ });
export const Slash = createToken({ name: "Slash", pattern: /\// });

// Quoted string values
export const QuotedString = createToken({
  name: "QuotedString",
  pattern: /"[^"]*"/,
});

// Complex value - catches talent strings, professions, upgrade currencies, etc.
// Allow embedded '=', ':', '/', '+', '-' while avoiding plain identifiers
export const ComplexValue = createToken({
  name: "ComplexValue",
  // Must contain at least one special separator (+ - . : /) to avoid swallowing plain identifiers.
  // '=' is allowed inside the value but only together with another separator (enforced by lookahead).
  pattern: /(?=[a-zA-Z0-9_+\-.:=/]*[+\-.:/])[a-zA-Z0-9_+\-.:=/]*[a-zA-Z0-9_/]/,
});

// Fallback for any unquoted value (excluding commas, newlines, comment start, '=')
export const UnquotedValue = createToken({
  name: "UnquotedValue",
  pattern: /[^,\n\r#=]+/,
});

// Numbers (integers only in SimC)
export const Integer = createToken({
  name: "Integer",
  pattern: /\d+/,
});

// Identifiers (keys like "level", "race", "bonus_id")
// Also matches simple values like "orc", "beast_mastery"
export const Identifier = createToken({
  name: "Identifier",
  pattern: /[a-zA-Z_][a-zA-Z0-9_]*/,
});

// -----------------------------------------------------------------------------
// Lexer Definition
// -----------------------------------------------------------------------------

// Token order matters - more specific patterns must come first
export const allTokens = [
  // Skip groups first
  Comment,
  WhiteSpace,

  // Structural
  Newline,

  // Operators
  Equals,
  Comma,
  Slash,

  // Values - order matters!
  QuotedString,
  // ComplexValue BEFORE simpler patterns to catch talent strings, professions
  ComplexValue,
  // Identifier for simple keys and values
  Identifier,
  // Integer for numbers
  Integer,
  // Catch-all for leftover unquoted sequences (after identifiers so keys still parse)
  UnquotedValue,
];

export const SimcLexer = new Lexer(allTokens);

export function tokenize(input: string) {
  return SimcLexer.tokenize(input);
}
