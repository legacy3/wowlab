//! Spell Description Parser
//!
//! Parses WoW spell description text with variables like `$s1`, `$d`,
//! conditionals like `$?a123[true][false]`, expressions like `${$s1 * 2}`, etc.
//!
//! # Example
//!
//! ```
//! use wowlab_parsers::spell_desc::parse;
//!
//! let result = parse("Deals $s1 damage over $d.");
//! assert!(result.errors.is_empty());
//! assert_eq!(result.ast.nodes.len(), 5); // Text, EffectVar, Text, SpellLevelVar, Text
//! ```

mod lexer;
mod parser;
mod types;

pub use parser::{parse, ParseError, ParseResult};
pub use types::*;

// Re-export lexer for advanced use cases
pub use lexer::{lex, tokenize, ExprToken, Token};

#[cfg(test)]
mod tests;
