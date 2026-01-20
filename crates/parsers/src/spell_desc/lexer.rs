//! Lexer for WoW spell description strings
//!
//! Uses logos to tokenize spell descriptions into a stream of tokens.
//! The lexer handles variable references, conditionals, expressions, and formatting.

use logos::{Lexer as LogosLexer, Logos};

/// Extract expression block content between ${ and }
fn parse_expression_block<'a>(lex: &mut LogosLexer<'a, Token<'a>>) -> &'a str {
    let remainder = lex.remainder();
    let mut depth = 1;
    let mut end = 0;

    for (i, c) in remainder.char_indices() {
        match c {
            '{' => depth += 1,
            '}' => {
                depth -= 1;
                if depth == 0 {
                    end = i;
                    break;
                }
            }
            _ => {}
        }
    }

    lex.bump(end + 1); // include the closing }
    &remainder[..end]
}

/// Extract pluralization content between $l/$L and ;
fn parse_pluralization<'a>(lex: &mut LogosLexer<'a, Token<'a>>) -> (&'a str, bool) {
    let slice = lex.slice();
    let capitalized = slice.chars().nth(1) == Some('L');
    let content = &slice[2..slice.len() - 1]; // strip $l and ;
    (content, capitalized)
}

/// Extract gender content between $g/$G and ;
fn parse_gender<'a>(lex: &mut LogosLexer<'a, Token<'a>>) -> (&'a str, bool) {
    let slice = lex.slice();
    let capitalized = slice.chars().nth(1) == Some('G');
    let content = &slice[2..slice.len() - 1]; // strip $g and ;
    (content, capitalized)
}

/// Parse conditional function call like $gt($s1,5)
fn parse_cond_func<'a>(lex: &mut LogosLexer<'a, Token<'a>>) -> &'a str {
    lex.slice()
}

/// Tokens for spell description parsing
#[derive(Logos, Debug, Clone, PartialEq)]
pub enum Token<'a> {
    // ========================================================================
    // Expression blocks (must come early)
    // ========================================================================
    /// Expression block: ${...}
    #[regex(r"\$\{", parse_expression_block)]
    ExpressionBlock(&'a str),

    // ========================================================================
    // Custom and @ variables (specific patterns first)
    // ========================================================================
    /// Custom variable: $<varname>
    #[regex(r"\$<[a-zA-Z][a-zA-Z0-9]*>", priority = 10)]
    CustomVariable(&'a str),

    /// @ variable: $@spelldesc123, $@spellname, $@versadmg
    #[regex(r"\$@[a-zA-Z]+\d*", priority = 10)]
    AtVariable(&'a str),

    // ========================================================================
    // Effect variables: $s1, $m1, $M1, $o1, $t1, $a1, $A1, $e1, $w1, $x1, $bc1, $q1
    // ========================================================================
    #[regex(r"\$(?:s|m|M|o|t|a|A|e|w|x|bc|q)[1-9]", priority = 10)]
    EffectVariable(&'a str),

    // ========================================================================
    // Spell-level variables: $d, $d1, $d2, $d3, $n, $u, $h, $r, $i, $p, $p1, $z, $c1
    // ========================================================================
    #[regex(r"\$(?:d[1-3]?|n|u|h|r|i|p\d?|z|c\d)", priority = 10)]
    SpellLevelVariable(&'a str),

    // ========================================================================
    // Player variables: $SP, $sp, $AP, $ap, $RAP, $MHP, $mhp, $SPS, $PL, $pl, $INT
    // ========================================================================
    #[regex(r"\$(?:SP|sp|AP|ap|RAP|MHP|mhp|SPS|PL|pl|INT)", priority = 10)]
    PlayerVariable(&'a str),

    // ========================================================================
    // Enchant variables: $ec1, $ecix, $ecd
    // ========================================================================
    #[regex(r"\$(?:ec1|ecix|ecd)", priority = 10)]
    EnchantVariable(&'a str),

    // ========================================================================
    // Misc variables: $maxcast, $pctD, $W, $W2, $B, $ctrmax1
    // ========================================================================
    #[regex(r"\$(?:maxcast|pctD|W2?|B|ctrmax\d+)", priority = 10)]
    MiscVariable(&'a str),

    // ========================================================================
    // Conditionals
    // ========================================================================
    /// Conditional start: $?
    #[token("$?", priority = 10)]
    ConditionalStart,

    // ========================================================================
    // Pluralization and gender
    // ========================================================================
    /// Pluralization: $lsing:plur; or $Lsing:plur;
    #[regex(r"\$[lL][^:;]*:[^;]*;", parse_pluralization, priority = 10)]
    Pluralization((&'a str, bool)),

    /// Gender: $gmale:female; or $Gmale:female;
    #[regex(r"\$[gG][^:;]*:[^;]*;", parse_gender, priority = 10)]
    Gender((&'a str, bool)),

    // ========================================================================
    // Cross-spell references: $123456s1, $123456d, $123456bc1
    // ========================================================================
    #[regex(r"\$\d+[a-zA-Z]+\d*", priority = 10)]
    CrossSpellRef(&'a str),

    // ========================================================================
    // Fallback simple variable (catches unknown $xxx patterns)
    // ========================================================================
    #[regex(r"\$[a-zA-Z_][a-zA-Z0-9_]*", priority = 1)]
    SimpleVariable(&'a str),

    /// Lone dollar sign
    #[token("$")]
    Dollar,

    // ========================================================================
    // Color codes
    // ========================================================================
    /// Color code: |cFFFFFFFF (8 hex digits after c) or |r (reset)
    #[regex(r"\|c[0-9a-fA-F]{8}|\|r", priority = 5)]
    ColorCode(&'a str),

    /// Pipe (color reset or separator)
    #[token("|")]
    Pipe,

    // ========================================================================
    // Brackets (for conditionals)
    // ========================================================================
    #[token("[")]
    LBracket,

    #[token("]")]
    RBracket,

    // ========================================================================
    // Conditional predicate tokens
    // ========================================================================
    /// Conditional function call: $gt(...), $cond(...), etc.
    #[regex(r"\$[a-zA-Z]+\([^)]*\)", parse_cond_func, priority = 10)]
    CondFuncCall(&'a str),

    /// Question mark (for chained conditionals)
    #[token("?")]
    Question,

    // ========================================================================
    // Text content
    // ========================================================================
    /// Plain text (anything not a special token)
    #[regex(r"[^$|\[\]?]+")]
    Text(&'a str),
}

/// Type alias for the logos lexer
pub type Lexer<'a> = LogosLexer<'a, Token<'a>>;

/// Create a new lexer for the given input
pub fn lex(input: &str) -> Lexer<'_> {
    Token::lexer(input)
}

/// Tokenize input and collect all tokens (ignoring errors)
pub fn tokenize(input: &str) -> Vec<Token<'_>> {
    lex(input).filter_map(|r| r.ok()).collect()
}

// ============================================================================
// Expression lexer (for content inside ${...})
// ============================================================================

/// Tokens for expression parsing inside ${...} blocks
#[derive(Logos, Debug, Clone, PartialEq)]
#[logos(skip r"[ \t]+")]
pub enum ExprToken<'a> {
    /// Decimal format specifier: .1, .2, etc.
    #[regex(r"\.\d", |lex| lex.slice().chars().nth(1).and_then(|c| c.to_digit(10)).map(|d| d as u8))]
    DecimalFormat(u8),

    /// Custom variable: $<varname>
    #[regex(r"\$<[a-zA-Z][a-zA-Z0-9]*>", priority = 10)]
    CustomVar(&'a str),

    /// Effect variable: $s1, $m1, etc.
    #[regex(r"\$(?:s|m|M|o|t|a|A|e|w|x|bc|q)[1-9]", priority = 10)]
    EffectVar(&'a str),

    /// Spell-level variable: $d, $n, etc.
    #[regex(r"\$(?:d[1-3]?|n|u|h|r|i|p\d?|z|c\d)", priority = 10)]
    SpellLevelVar(&'a str),

    /// Player variable: $SP, $AP, etc.
    #[regex(r"\$(?:SP|sp|AP|ap|RAP|MHP|mhp|SPS|PL|pl|INT)", priority = 10)]
    PlayerVar(&'a str),

    /// Enchant variable: $ec1, $ecix, $ecd
    #[regex(r"\$(?:ec1|ecix|ecd)", priority = 10)]
    EnchantVar(&'a str),

    /// Misc variable: $maxcast, $pctD, etc.
    #[regex(r"\$(?:maxcast|pctD|W2?|B|ctrmax\d+)", priority = 10)]
    MiscVar(&'a str),

    /// @ variable: $@spelldesc123
    #[regex(r"\$@[a-zA-Z]+\d*", priority = 10)]
    AtVar(&'a str),

    /// Cross-spell reference: $123456s1
    #[regex(r"\$\d+[a-zA-Z]+\d*", priority = 10)]
    CrossSpellRef(&'a str),

    /// Dollar function: $gt, $cond, $max, $min, $clamp, $floor, $gte, $lt, $lte
    #[regex(r"\$(?:cond|gte|gt|lte|lt|max|min|clamp|floor)", priority = 10)]
    DollarFunc(&'a str),

    /// Simple variable (fallback)
    #[regex(r"\$[a-zA-Z_][a-zA-Z0-9_]*", priority = 1)]
    SimpleVar(&'a str),

    /// Number literal
    #[regex(r"\d+(?:\.\d+)?", |lex| lex.slice().parse::<f64>().ok())]
    Number(f64),

    /// Identifier (for function names without $)
    #[regex(r"[a-zA-Z_][a-zA-Z0-9_]*")]
    Ident(&'a str),

    #[token("(")]
    LParen,

    #[token(")")]
    RParen,

    #[token("+")]
    Plus,

    #[token("-")]
    Minus,

    #[token("*")]
    Star,

    #[token("/")]
    Slash,

    #[token(",")]
    Comma,
}

/// Create a new expression lexer for the given input
pub fn lex_expr(input: &str) -> LogosLexer<'_, ExprToken<'_>> {
    ExprToken::lexer(input)
}

/// Tokenize expression and collect all tokens
#[allow(dead_code)]
pub fn tokenize_expr(input: &str) -> Vec<ExprToken<'_>> {
    lex_expr(input).filter_map(|r| r.ok()).collect()
}
