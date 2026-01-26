//! Lexer for WoW spell description strings
//!
//! Uses logos to tokenize spell descriptions into a stream of tokens.
//! The lexer handles variable references, conditionals, expressions, and formatting.

use logos::{Lexer as LogosLexer, Logos};

/// Extract expression block content between ${ and }
/// Also captures optional trailing decimal format specifier like `.2`
/// Returns tuple: (expression_content, optional_decimal_places)
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

    // Check for trailing decimal format specifier like `.2` after the closing }
    let after_brace = &remainder[end + 1..];
    let format_len = if let Some(after_dot) = after_brace.strip_prefix('.') {
        // Count digits after the dot
        let digits: usize = after_dot
            .chars()
            .take_while(|c| c.is_ascii_digit())
            .count();
        if digits > 0 {
            1 + digits // include the dot
        } else {
            0
        }
    } else {
        0
    };

    lex.bump(end + 1 + format_len); // include closing } and optional .N

    // Return the full slice including the format specifier (if any)
    // The parser will extract the format from the slice
    &remainder[..end + format_len + 1]
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
    // Expression blocks (must come early)
    /// Expression block: ${...}
    #[regex(r"\$\{", parse_expression_block)]
    ExpressionBlock(&'a str),

    // Custom and @ variables (specific patterns first)
    /// Custom variable: $<varname>
    #[regex(r"\$<[a-zA-Z][a-zA-Z0-9]*>", priority = 10)]
    CustomVariable(&'a str),

    /// @ variable: $@spelldesc123, $@spellname, $@versadmg
    #[regex(r"\$@[a-zA-Z]+\d*", priority = 10)]
    AtVariable(&'a str),

    // Effect variables: $s1, $S1, $m1, $M1, $o1, $t1, $a1, $A1, $e1, $w1, $W1, $x1, $bc1, $q1, $sw1
    // Note: $s and $S are equivalent (normalized to lowercase in parser)
    // $m vs $M and $a vs $A are semantically different but both valid
    // $w vs $W are different (w=weapon coeff, W=weapon damage)
    // $sw is "spell weapon" damage
    #[regex(r"\$(?:[sS]|m|M|o|t|a|A|e|w|W|x|bc|q|sw)[1-9]", priority = 10)]
    EffectVariable(&'a str),

    // Spell-level variables: $d, $d1, $d2, $d3, $n, $u, $h, $r, $i, $p, $p1, $z, $c1
    #[regex(r"\$(?:d[1-3]?|n|u|h|r|i|p\d?|z|c\d)", priority = 10)]
    SpellLevelVariable(&'a str),

    // Player variables: $SP, $sp, $AP, $ap, $RAP, $MHP, $mhp, $SPS, $PL, $pl, $INT
    #[regex(r"\$(?:SP|sp|AP|ap|RAP|MHP|mhp|SPS|PL|pl|INT)", priority = 10)]
    PlayerVariable(&'a str),

    // Enchant variables: $ec1, $ec2, $ecix, $ecim, $ecd, $ec1s1 (combined)
    #[regex(r"\$(?:ec[12](?:s\d)?|ecix|ecim|ecd)", priority = 10)]
    EnchantVariable(&'a str),

    // Misc variables: weapon stats, proc data, mastery, counters, etc.
    // $mws/$MWS = main-hand weapon speed, $mwb/$MWB = main-hand weapon dps
    // $ows/$OWB = off-hand weapon stats
    // $proccooldown, $procrppm = proc timing
    // $lpoint = level point, $mastery = mastery value
    // $pri = priority, $rolemult = role multiplier
    // $ctrmax = counter max (with number suffix)
    #[regex(r"\$(?:maxcast|pctD|W|B|ctrmax\d+|mws|mwb|MWS|MWB|ows|OWB|lpoint|mastery|mas|proccooldown|procrppm|pri|rolemult)", priority = 10)]
    MiscVariable(&'a str),

    // Conditionals
    /// Conditional start: $?
    #[token("$?", priority = 10)]
    ConditionalStart,

    // Pluralization and gender
    /// Pluralization: $lsing:plur; or $Lsing:plur;
    #[regex(r"\$[lL][^:;]*:[^;]*;", parse_pluralization, priority = 10)]
    Pluralization((&'a str, bool)),

    /// Gender: $gmale:female; or $Gmale:female;
    #[regex(r"\$[gG][^:;]*:[^;]*;", parse_gender, priority = 10)]
    Gender((&'a str, bool)),

    // Cross-spell references: $123456s1, $123456d, $123456bc1
    #[regex(r"\$\d+[a-zA-Z]+\d*", priority = 10)]
    CrossSpellRef(&'a str),

    // Fallback simple variable (catches unknown $xxx patterns)
    #[regex(r"\$[a-zA-Z_][a-zA-Z0-9_]*", priority = 1)]
    SimpleVariable(&'a str),

    /// Lone dollar sign
    #[token("$")]
    Dollar,

    // Color codes
    /// Color code: |cFFFFFFFF (8 hex digits after c) or |r (reset)
    #[regex(r"\|c[0-9a-fA-F]{8}|\|r", priority = 5)]
    ColorCode(&'a str),

    /// Pipe (color reset or separator)
    #[token("|")]
    Pipe,

    // Brackets (for conditionals)
    #[token("[")]
    LBracket,

    #[token("]")]
    RBracket,

    // Conditional predicate tokens
    /// Conditional function call: $gt(...), $cond(...), etc.
    #[regex(r"\$[a-zA-Z]+\([^)]*\)", parse_cond_func, priority = 10)]
    CondFuncCall(&'a str),

    /// Question mark (for chained conditionals)
    #[token("?")]
    Question,

    // Text content
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

// Expression lexer (for content inside ${...})

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

    /// Effect variable: $s1, $S1, $m1, $M1, $w1, $W1, $sw1, etc.
    #[regex(r"\$(?:[sS]|m|M|o|t|a|A|e|w|W|x|bc|q|sw)[1-9]", priority = 10)]
    EffectVar(&'a str),

    /// Spell-level variable: $d, $n, etc.
    #[regex(r"\$(?:d[1-3]?|n|u|h|r|i|p\d?|z|c\d)", priority = 10)]
    SpellLevelVar(&'a str),

    /// Player variable: $SP, $AP, etc.
    #[regex(r"\$(?:SP|sp|AP|ap|RAP|MHP|mhp|SPS|PL|pl|INT)", priority = 10)]
    PlayerVar(&'a str),

    /// Enchant variable: $ec1, $ec2, $ecix, $ecim, $ecd, $ec1s1
    #[regex(r"\$(?:ec[12](?:s\d)?|ecix|ecim|ecd)", priority = 10)]
    EnchantVar(&'a str),

    /// Misc variable: weapon stats, proc data, mastery, etc.
    #[regex(r"\$(?:maxcast|pctD|W|B|ctrmax\d+|mws|mwb|MWS|MWB|ows|OWB|lpoint|mastery|mas|proccooldown|procrppm|pri|rolemult)", priority = 10)]
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

// Tokenization to fragments (for debug UI highlighting)

use crate::types::spell_desc::SpellDescFragment;

/// Convert a token to its corresponding fragment.
fn token_to_fragment(token: &Token<'_>, input: &str, span: std::ops::Range<usize>) -> SpellDescFragment {
    match token {
        // Color codes -> ColorStart/ColorEnd
        Token::ColorCode(code) => {
            if code.to_lowercase() == "|r" {
                SpellDescFragment::ColorEnd
            } else {
                SpellDescFragment::ColorStart {
                    color: code[2..].to_uppercase(),
                }
            }
        }

        // Expression blocks -> RawToken
        Token::ExpressionBlock(_) => SpellDescFragment::RawToken {
            value: format!("${{{}}}", &input[span.start + 2..span.end]),
        },

        // Pluralization/Gender -> RawToken with reconstructed syntax
        Token::Pluralization((content, cap)) => SpellDescFragment::RawToken {
            value: format!("{}{};\u{200B}", if *cap { "$L" } else { "$l" }, content),
        },
        Token::Gender((content, cap)) => SpellDescFragment::RawToken {
            value: format!("{}{};\u{200B}", if *cap { "$G" } else { "$g" }, content),
        },

        // Variables and conditionals -> RawToken
        Token::CustomVariable(_)
        | Token::AtVariable(_)
        | Token::EffectVariable(_)
        | Token::SpellLevelVariable(_)
        | Token::PlayerVariable(_)
        | Token::EnchantVariable(_)
        | Token::MiscVariable(_)
        | Token::CrossSpellRef(_)
        | Token::SimpleVariable(_)
        | Token::ConditionalStart
        | Token::CondFuncCall(_) => SpellDescFragment::RawToken {
            value: input[span].to_string(),
        },

        // Everything else -> Text
        _ => SpellDescFragment::Text {
            value: input[span].to_string(),
        },
    }
}

/// Tokenize input and return fragments for debug display.
///
/// Variables and expressions become RawToken fragments (highlighted).
/// Color codes become ColorStart/ColorEnd fragments.
/// Plain text becomes Text fragments.
pub fn tokenize_to_fragments(input: &str) -> Vec<SpellDescFragment> {
    let mut lexer = lex(input);
    let mut fragments = Vec::new();

    while let Some(result) = lexer.next() {
        if let Ok(token) = result {
            let fragment = token_to_fragment(&token, input, lexer.span());

            // Merge adjacent text fragments
            if let SpellDescFragment::Text { value } = &fragment {
                if let Some(SpellDescFragment::Text { value: existing }) = fragments.last_mut() {
                    existing.push_str(value);
                    continue;
                }
            }

            fragments.push(fragment);
        }
    }

    fragments
}
