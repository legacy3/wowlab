//! Lexer for SimC profile strings
//!
//! Uses logos to tokenize SimC profiles into a stream of tokens.

use logos::{Lexer as LogosLexer, Logos};

/// Callback to parse comment content (everything after # until newline)
fn parse_comment<'a>(lex: &mut LogosLexer<'a, Token<'a>>) -> &'a str {
    let remainder = lex.remainder();
    let end = remainder.find(['\r', '\n']).unwrap_or(remainder.len());
    lex.bump(end);
    lex.slice()
}

/// Tokens for SimC profile parsing
#[derive(Logos, Debug, Clone, PartialEq)]
#[logos(skip r"[ \t]+")]
pub enum Token<'a> {
    #[regex(r"[0-9]+", |lex| lex.slice().parse::<u32>().ok())]
    Number(u32),

    #[regex(r#""[^"]*""#, |lex| { let s = lex.slice(); &s[1..s.len()-1] })]
    String(&'a str),

    #[regex(r"'[^']*'", |lex| { let s = lex.slice(); &s[1..s.len()-1] })]
    SingleString(&'a str),

    #[regex(r"[a-zA-Z_][a-zA-Z0-9_]*")]
    Ident(&'a str),

    #[token("=")]
    Eq,

    #[token(",")]
    Comma,

    #[token("/")]
    Slash,

    #[token(":")]
    Colon,

    #[regex(r"\r?\n")]
    Newline,

    #[token("#", parse_comment)]
    Comment(&'a str),
}

/// Type alias for the logos lexer
pub type Lexer<'a> = LogosLexer<'a, Token<'a>>;

/// Create a new lexer for the given input
pub fn lex(input: &str) -> Lexer<'_> {
    Token::lexer(input)
}

#[cfg(test)]
mod tests;
