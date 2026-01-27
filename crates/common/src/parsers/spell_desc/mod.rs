//! Spell Description Parser and Renderer
//!
//! Parses WoW spell description text with variables like `$s1`, `$d`,
//! conditionals like `$?a123[true][false]`, expressions like `${$s1 * 2}`, etc.
//!
//! # Workflow
//!
//! 1. Parse the description: `parse(description)` -> AST
//! 2. Analyze dependencies: `analyze_dependencies(ast, spell_id)` -> SpellDescDependencies
//! 3. Fetch required data (spell effects, player stats, etc.)
//! 4. Render with resolver: `render_with_resolver(ast, spell_id, resolver, errors)` -> SpellDescRenderResult
//!
//! # Example
//!
//! ```ignore
//! use wowlab_common::parsers::spell_desc::{parse, analyze_dependencies, render_with_resolver, NullResolver};
//!
//! let result = parse("Deals $s1 damage over $d.");
//! assert!(result.errors.is_empty());
//!
//! let deps = analyze_dependencies(&result.ast, 12345);
//! assert!(deps.spell_ids.contains(&12345));
//!
//! let resolver = NullResolver;
//! let parse_errors: Vec<String> = result.errors.iter().map(|e| e.to_string()).collect();
//! let rendered = render_with_resolver(&result.ast, 12345, &resolver, parse_errors);
//! // Result contains fragments - without data, variables show as Unresolved tokens
//! ```

mod analyzer;
mod lexer;
mod parser;
mod renderer;
mod resolver;
mod types;
#[cfg(feature = "wasm")]
mod wasm;

// Parser
pub use parser::{parse, ParseError, ParseResult};

// AST types
pub use types::*;

// Analyzer
pub use analyzer::analyze_dependencies;

// Resolver trait and implementations
pub use resolver::{NullResolver, SpellDescResolver, TestResolver};

// Renderer
pub use renderer::render_with_resolver;

// WASM bindings
#[cfg(feature = "wasm")]
pub use wasm::{
    wasm_analyze_spell_desc, wasm_render_spell_desc, wasm_tokenize_spell_desc, AnalyzeResult,
};

// Re-export lexer for advanced use cases
pub use lexer::{lex, tokenize, tokenize_to_fragments, ExprToken, Token};
