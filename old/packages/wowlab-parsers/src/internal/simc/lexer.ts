import { createToken, Lexer } from "chevrotain";

export const Comment = createToken({
  group: Lexer.SKIPPED,
  line_breaks: false,
  name: "Comment",
  pattern: /#[^\n\r]*/,
});

export const WhiteSpace = createToken({
  group: Lexer.SKIPPED,
  name: "WhiteSpace",
  pattern: /[ \t]+/,
});

export const Newline = createToken({
  line_breaks: true,
  name: "Newline",
  pattern: /\r?\n/,
});

export const Equals = createToken({ name: "Equals", pattern: /=/ });
export const Comma = createToken({ name: "Comma", pattern: /,/ });
export const Slash = createToken({ name: "Slash", pattern: /\// });

export const QuotedString = createToken({
  name: "QuotedString",
  pattern: /"[^"]*"/,
});

// catches talent strings, professions, etc. must have at least one separator (+ - . : /)
// to avoid matching plain identifiers. '=' allowed only with another separator present
export const ComplexValue = createToken({
  name: "ComplexValue",
  pattern: /(?=[a-zA-Z0-9_+\-.:=/]*[+\-.:/])[a-zA-Z0-9_+\-.:=/]*[a-zA-Z0-9_/]/,
});

// fallback for unquoted values
export const UnquotedValue = createToken({
  name: "UnquotedValue",
  pattern: /[^,\n\r#=]+/,
});

export const Integer = createToken({
  name: "Integer",
  pattern: /\d+/,
});

export const Identifier = createToken({
  name: "Identifier",
  pattern: /[a-zA-Z_][a-zA-Z0-9_]*/,
});

// order matters: more specific patterns first
export const allTokens = [
  Comment,
  WhiteSpace,
  Newline,
  Equals,
  Comma,
  Slash,
  QuotedString,
  ComplexValue, // before identifier to catch talent strings
  Identifier,
  Integer,
  UnquotedValue, // catch-all last
];

export const SimcLexer = new Lexer(allTokens);

export function tokenize(input: string) {
  return SimcLexer.tokenize(input);
}
