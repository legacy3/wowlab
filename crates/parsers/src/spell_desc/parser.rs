//! Parser for WoW spell description strings
//!
//! Converts a token stream into a typed AST representation.

use super::lexer::{lex_expr, tokenize, ExprToken, Token};
use super::types::*;

// ============================================================================
// Public API
// ============================================================================

/// Parse a spell description string into a typed AST
pub fn parse(input: &str) -> ParseResult {
    let tokens = tokenize(input);
    let mut parser = Parser::new(&tokens);
    let nodes = parser.parse_description();

    ParseResult {
        ast: ParsedSpellDescription { nodes },
        errors: parser.errors,
    }
}

/// Result of parsing a spell description
#[derive(Debug, Clone)]
pub struct ParseResult {
    pub ast: ParsedSpellDescription,
    pub errors: Vec<ParseError>,
}

/// A parse error
#[derive(Debug, Clone, PartialEq)]
pub struct ParseError {
    pub message: String,
}

impl std::fmt::Display for ParseError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl std::error::Error for ParseError {}

// ============================================================================
// Parser
// ============================================================================

struct Parser<'a> {
    tokens: &'a [Token<'a>],
    pos: usize,
    errors: Vec<ParseError>,
}

impl<'a> Parser<'a> {
    fn new(tokens: &'a [Token<'a>]) -> Self {
        Self {
            tokens,
            pos: 0,
            errors: Vec::new(),
        }
    }

    fn peek(&self) -> Option<&Token<'a>> {
        self.tokens.get(self.pos)
    }

    fn advance(&mut self) -> Option<&Token<'a>> {
        let t = self.tokens.get(self.pos);
        if t.is_some() {
            self.pos += 1;
        }
        t
    }

    fn parse_description(&mut self) -> Vec<SpellDescriptionNode> {
        let mut nodes = Vec::new();

        while self.pos < self.tokens.len() {
            if let Some(node) = self.parse_segment() {
                nodes.push(node);
            }
        }

        nodes
    }

    fn parse_segment(&mut self) -> Option<SpellDescriptionNode> {
        let token = self.peek()?.clone();
        self.pos += 1;

        match token {
            Token::Text(s) => Some(SpellDescriptionNode::Text(TextNode {
                value: s.to_string(),
            })),

            Token::ExpressionBlock(content) => self.parse_expression_block(content),

            Token::CustomVariable(s) => Some(SpellDescriptionNode::Variable(parse_custom_var(s))),

            Token::AtVariable(s) => Some(SpellDescriptionNode::Variable(parse_at_var(s))),

            Token::EffectVariable(s) => Some(SpellDescriptionNode::Variable(parse_effect_var(s))),

            Token::SpellLevelVariable(s) => {
                Some(SpellDescriptionNode::Variable(parse_spell_level_var(s)))
            }

            Token::PlayerVariable(s) => Some(SpellDescriptionNode::Variable(parse_player_var(s))),

            Token::EnchantVariable(s) => Some(SpellDescriptionNode::Variable(parse_enchant_var(s))),

            Token::MiscVariable(s) => Some(SpellDescriptionNode::Variable(parse_misc_var(s))),

            Token::CrossSpellRef(s) => Some(SpellDescriptionNode::Variable(parse_cross_spell_ref(s))),

            Token::SimpleVariable(s) => {
                // Treat unknown variables as misc
                Some(SpellDescriptionNode::Variable(VariableNode::Misc(
                    MiscVariableNode {
                        var_name: s[1..].to_string(),
                        id: None,
                    },
                )))
            }

            Token::ConditionalStart => self.parse_conditional(),

            Token::Pluralization((content, capitalized)) => {
                Some(SpellDescriptionNode::Pluralization(parse_pluralization(
                    content,
                    capitalized,
                )))
            }

            Token::Gender((content, capitalized)) => {
                Some(SpellDescriptionNode::Gender(parse_gender(content, capitalized)))
            }

            Token::ColorCode(s) => Some(SpellDescriptionNode::ColorCode(ColorCodeNode {
                code: s[1..].to_string(),
            })),

            Token::Dollar => Some(SpellDescriptionNode::Text(TextNode {
                value: "$".to_string(),
            })),

            Token::Pipe => Some(SpellDescriptionNode::Text(TextNode {
                value: "|".to_string(),
            })),

            Token::LBracket => Some(SpellDescriptionNode::Text(TextNode {
                value: "[".to_string(),
            })),

            Token::RBracket => Some(SpellDescriptionNode::Text(TextNode {
                value: "]".to_string(),
            })),

            Token::Question => Some(SpellDescriptionNode::Text(TextNode {
                value: "?".to_string(),
            })),

            Token::CondFuncCall(s) => Some(SpellDescriptionNode::Text(TextNode {
                value: s.to_string(),
            })),
        }
    }

    fn parse_expression_block(&mut self, content: &str) -> Option<SpellDescriptionNode> {
        let mut expr_parser = ExprParser::new(content);
        let (expression, decimal_places) = expr_parser.parse();

        self.errors.extend(expr_parser.errors);

        expression.map(|expr| {
            SpellDescriptionNode::ExpressionBlock(ExpressionBlockNode {
                expression: expr,
                decimal_places,
            })
        })
    }

    fn parse_conditional(&mut self) -> Option<SpellDescriptionNode> {
        let mut conditions = Vec::new();
        let mut else_branch = None;

        // Parse first condition predicate
        let predicate = self.parse_condition_predicate();

        // Parse first branch content [...]
        let content = self.parse_branch_content();

        conditions.push(ConditionalBranchNode { predicate, content });

        // Parse chained conditions or else branch
        loop {
            match self.peek() {
                Some(Token::Question) => {
                    self.advance();
                    let pred = self.parse_condition_predicate();
                    let cont = self.parse_branch_content();
                    conditions.push(ConditionalBranchNode {
                        predicate: pred,
                        content: cont,
                    });
                }
                Some(Token::LBracket) => {
                    // This is the else branch
                    else_branch = Some(self.parse_branch_content());
                    break;
                }
                _ => break,
            }
        }

        Some(SpellDescriptionNode::Conditional(ConditionalNode {
            conditions,
            else_branch,
        }))
    }

    fn parse_condition_predicate(&mut self) -> ConditionalPredicateNode {
        let mut conditions = Vec::new();

        // Parse first condition
        if let Some(cond) = self.parse_single_condition() {
            conditions.push(cond);
        }

        // Parse OR'd conditions (|cond)
        while matches!(self.peek(), Some(Token::Pipe)) {
            self.advance();
            if let Some(cond) = self.parse_single_condition() {
                conditions.push(cond);
            }
        }

        ConditionalPredicateNode { conditions }
    }

    fn parse_single_condition(&mut self) -> Option<SingleConditionNode> {
        match self.peek() {
            Some(Token::CondFuncCall(s)) => {
                let s = *s;
                self.advance();
                Some(parse_cond_func_call(s))
            }
            Some(Token::Text(s)) => {
                let s = *s;
                self.advance();
                parse_condition_type(s)
            }
            Some(Token::SimpleVariable(s)) => {
                // Handle $gt(...) style in text context
                let s = *s;
                self.advance();
                // Check if it looks like a condition type
                parse_condition_type(s)
            }
            _ => None,
        }
    }

    fn parse_branch_content(&mut self) -> Vec<SpellDescriptionNode> {
        let mut nodes = Vec::new();

        // Expect [
        if !matches!(self.peek(), Some(Token::LBracket)) {
            return nodes;
        }
        self.advance();

        // Parse content until ]
        let mut depth = 1;
        while depth > 0 && self.pos < self.tokens.len() {
            match self.peek() {
                Some(Token::LBracket) => {
                    depth += 1;
                    self.advance();
                    nodes.push(SpellDescriptionNode::Text(TextNode {
                        value: "[".to_string(),
                    }));
                }
                Some(Token::RBracket) => {
                    depth -= 1;
                    self.advance();
                    if depth > 0 {
                        nodes.push(SpellDescriptionNode::Text(TextNode {
                            value: "]".to_string(),
                        }));
                    }
                }
                Some(Token::ConditionalStart) => {
                    self.advance();
                    if let Some(node) = self.parse_conditional() {
                        nodes.push(node);
                    }
                }
                _ => {
                    if let Some(node) = self.parse_segment() {
                        nodes.push(node);
                    }
                }
            }
        }

        nodes
    }
}

// ============================================================================
// Expression Parser
// ============================================================================

struct ExprParser<'a> {
    tokens: Vec<ExprToken<'a>>,
    pos: usize,
    decimal_places: Option<u8>,
    errors: Vec<ParseError>,
}

impl<'a> ExprParser<'a> {
    fn new(input: &'a str) -> Self {
        let tokens: Vec<_> = lex_expr(input).filter_map(|r| r.ok()).collect();
        Self {
            tokens,
            pos: 0,
            decimal_places: None,
            errors: Vec::new(),
        }
    }

    fn peek(&self) -> Option<&ExprToken<'a>> {
        self.tokens.get(self.pos)
    }

    fn advance(&mut self) -> Option<&ExprToken<'a>> {
        let t = self.tokens.get(self.pos);
        if t.is_some() {
            self.pos += 1;
        }
        t
    }

    fn parse(&mut self) -> (Option<ExpressionNode>, Option<u8>) {
        let expr = self.parse_expression();

        // Check for decimal format specifier at the end
        if let Some(ExprToken::DecimalFormat(d)) = self.peek() {
            self.decimal_places = Some(*d);
            self.advance();
        }

        (expr, self.decimal_places)
    }

    fn parse_expression(&mut self) -> Option<ExpressionNode> {
        self.parse_additive()
    }

    fn parse_additive(&mut self) -> Option<ExpressionNode> {
        let mut left = self.parse_multiplicative()?;

        loop {
            let op = match self.peek() {
                Some(ExprToken::Plus) => BinaryOperator::Add,
                Some(ExprToken::Minus) => BinaryOperator::Sub,
                _ => break,
            };
            self.advance();

            let right = self.parse_multiplicative()?;
            left = ExpressionNode::Binary(BinaryExpressionNode {
                left: Box::new(left),
                operator: op,
                right: Box::new(right),
            });
        }

        Some(left)
    }

    fn parse_multiplicative(&mut self) -> Option<ExpressionNode> {
        let mut left = self.parse_unary()?;

        loop {
            let op = match self.peek() {
                Some(ExprToken::Star) => BinaryOperator::Mul,
                Some(ExprToken::Slash) => BinaryOperator::Div,
                _ => break,
            };
            self.advance();

            let right = self.parse_unary()?;
            left = ExpressionNode::Binary(BinaryExpressionNode {
                left: Box::new(left),
                operator: op,
                right: Box::new(right),
            });
        }

        Some(left)
    }

    fn parse_unary(&mut self) -> Option<ExpressionNode> {
        if matches!(self.peek(), Some(ExprToken::Minus)) {
            self.advance();
            let operand = self.parse_atomic()?;
            return Some(ExpressionNode::Unary(UnaryExpressionNode {
                operator: UnaryOperator::Neg,
                operand: Box::new(operand),
            }));
        }

        self.parse_atomic()
    }

    fn parse_atomic(&mut self) -> Option<ExpressionNode> {
        match self.peek() {
            Some(ExprToken::LParen) => {
                self.advance();
                let expr = self.parse_expression()?;
                if matches!(self.peek(), Some(ExprToken::RParen)) {
                    self.advance();
                }
                Some(ExpressionNode::Paren(ParenExpressionNode {
                    expression: Box::new(expr),
                }))
            }

            Some(ExprToken::DollarFunc(s)) => {
                let func_name = s[1..].to_string(); // strip $
                self.advance();
                self.parse_function_args(func_name)
            }

            Some(ExprToken::Ident(s)) => {
                let func_name = (*s).to_string();
                self.advance();
                if matches!(self.peek(), Some(ExprToken::LParen)) {
                    self.parse_function_args(func_name)
                } else {
                    // Just an identifier, treat as unknown
                    self.errors.push(ParseError {
                        message: format!("Unexpected identifier: {}", func_name),
                    });
                    None
                }
            }

            Some(ExprToken::Number(n)) => {
                let value = *n;
                self.advance();
                Some(ExpressionNode::Number(NumberLiteralNode { value }))
            }

            Some(ExprToken::CustomVar(s)) => {
                let var = parse_custom_var(s);
                self.advance();
                Some(ExpressionNode::Variable(Box::new(var)))
            }

            Some(ExprToken::EffectVar(s)) => {
                let var = parse_effect_var(s);
                self.advance();
                Some(ExpressionNode::Variable(Box::new(var)))
            }

            Some(ExprToken::SpellLevelVar(s)) => {
                let var = parse_spell_level_var(s);
                self.advance();
                Some(ExpressionNode::Variable(Box::new(var)))
            }

            Some(ExprToken::PlayerVar(s)) => {
                let var = parse_player_var(s);
                self.advance();
                Some(ExpressionNode::Variable(Box::new(var)))
            }

            Some(ExprToken::EnchantVar(s)) => {
                let var = parse_enchant_var(s);
                self.advance();
                Some(ExpressionNode::Variable(Box::new(var)))
            }

            Some(ExprToken::MiscVar(s)) => {
                let var = parse_misc_var(s);
                self.advance();
                Some(ExpressionNode::Variable(Box::new(var)))
            }

            Some(ExprToken::AtVar(s)) => {
                let var = parse_at_var(s);
                self.advance();
                Some(ExpressionNode::Variable(Box::new(var)))
            }

            Some(ExprToken::CrossSpellRef(s)) => {
                let var = parse_cross_spell_ref(s);
                self.advance();
                Some(ExpressionNode::Variable(Box::new(var)))
            }

            Some(ExprToken::SimpleVar(s)) => {
                let var = VariableNode::Misc(MiscVariableNode {
                    var_name: s[1..].to_string(),
                    id: None,
                });
                self.advance();
                Some(ExpressionNode::Variable(Box::new(var)))
            }

            _ => None,
        }
    }

    fn parse_function_args(&mut self, func_name: String) -> Option<ExpressionNode> {
        // Expect (
        if !matches!(self.peek(), Some(ExprToken::LParen)) {
            return Some(ExpressionNode::FunctionCall(FunctionCallNode {
                func_name,
                args: Vec::new(),
            }));
        }
        self.advance();

        let mut args = Vec::new();

        // Parse arguments
        if !matches!(self.peek(), Some(ExprToken::RParen)) {
            if let Some(arg) = self.parse_expression() {
                args.push(arg);
            }

            while matches!(self.peek(), Some(ExprToken::Comma)) {
                self.advance();
                if let Some(arg) = self.parse_expression() {
                    args.push(arg);
                }
            }
        }

        // Expect )
        if matches!(self.peek(), Some(ExprToken::RParen)) {
            self.advance();
        }

        Some(ExpressionNode::FunctionCall(FunctionCallNode {
            func_name,
            args,
        }))
    }
}

// ============================================================================
// Variable parsing helpers
// ============================================================================

fn parse_effect_var(s: &str) -> VariableNode {
    let body = &s[1..]; // strip $
    let index = body
        .chars()
        .last()
        .and_then(|c| c.to_digit(10))
        .unwrap_or(1) as u8;
    let var_type = &body[..body.len() - 1];

    VariableNode::Effect(EffectVariableNode {
        var_type: var_type.to_string(),
        effect_index: index,
    })
}

fn parse_spell_level_var(s: &str) -> VariableNode {
    let body = &s[1..]; // strip $

    // Check if ends with digit
    let last_char = body.chars().last();
    let has_index = last_char.map(|c| c.is_ascii_digit()).unwrap_or(false) && body.len() > 1;

    let (var_type, index) = if has_index {
        let idx = last_char.and_then(|c| c.to_digit(10)).map(|d| d as u8);
        (&body[..body.len() - 1], idx)
    } else {
        (body, None)
    };

    VariableNode::SpellLevel(SpellLevelVariableNode {
        var_type: var_type.to_string(),
        index,
    })
}

fn parse_player_var(s: &str) -> VariableNode {
    VariableNode::Player(PlayerVariableNode {
        var_name: s[1..].to_string(),
    })
}

fn parse_enchant_var(s: &str) -> VariableNode {
    VariableNode::Enchant(EnchantVariableNode {
        var_type: s[1..].to_string(),
    })
}

fn parse_misc_var(s: &str) -> VariableNode {
    let body = &s[1..]; // strip $

    // Check for trailing digits (like ctrmax1)
    let digits: String = body.chars().rev().take_while(|c| c.is_ascii_digit()).collect();
    let id = if !digits.is_empty() {
        digits.chars().rev().collect::<String>().parse().ok()
    } else {
        None
    };

    let var_name = if id.is_some() {
        &body[..body.len() - digits.len()]
    } else {
        body
    };

    VariableNode::Misc(MiscVariableNode {
        var_name: var_name.to_string(),
        id,
    })
}

fn parse_custom_var(s: &str) -> VariableNode {
    // $<varname> -> extract varname
    let var_name = &s[2..s.len() - 1];
    VariableNode::Custom(CustomVariableNode {
        var_name: var_name.to_string(),
    })
}

fn parse_at_var(s: &str) -> VariableNode {
    let body = &s[2..]; // strip $@

    // Check for trailing digits (spell ID)
    let digits: String = body.chars().rev().take_while(|c| c.is_ascii_digit()).collect();
    let spell_id = if !digits.is_empty() {
        digits.chars().rev().collect::<String>().parse().ok()
    } else {
        None
    };

    let var_type = if spell_id.is_some() {
        &body[..body.len() - digits.len()]
    } else {
        body
    };

    VariableNode::At(AtVariableNode {
        var_type: var_type.to_string(),
        spell_id,
    })
}

fn parse_cross_spell_ref(s: &str) -> VariableNode {
    let body = &s[1..]; // strip $

    // Extract spell ID (leading digits)
    let id_digits: String = body.chars().take_while(|c| c.is_ascii_digit()).collect();
    let spell_id: u32 = id_digits.parse().unwrap_or(0);

    let remainder = &body[id_digits.len()..];

    // Extract trailing effect index
    let trail_digits: String = remainder.chars().rev().take_while(|c| c.is_ascii_digit()).collect();
    let effect_index = if !trail_digits.is_empty() {
        trail_digits.chars().rev().collect::<String>().parse().ok()
    } else {
        None
    };

    let var_type = if effect_index.is_some() {
        &remainder[..remainder.len() - trail_digits.len()]
    } else {
        remainder
    };

    VariableNode::CrossSpell(CrossSpellReferenceNode {
        spell_id,
        var_type: var_type.to_string(),
        effect_index,
    })
}

fn parse_pluralization(content: &str, capitalized: bool) -> PluralizationNode {
    let parts: Vec<&str> = content.splitn(2, ':').collect();
    let singular = parts.first().unwrap_or(&"").to_string();
    let plural = parts.get(1).unwrap_or(&"").to_string();

    PluralizationNode {
        singular,
        plural,
        capitalized,
    }
}

fn parse_gender(content: &str, capitalized: bool) -> GenderNode {
    let parts: Vec<&str> = content.splitn(2, ':').collect();
    let male = parts.first().unwrap_or(&"").to_string();
    let female = parts.get(1).unwrap_or(&"").to_string();

    GenderNode {
        male,
        female,
        capitalized,
    }
}

fn parse_condition_type(s: &str) -> Option<SingleConditionNode> {
    let s = s.trim();
    if s.is_empty() {
        return None;
    }

    // s123456 - spell known
    if let Some(rest) = s.strip_prefix('s') {
        if let Ok(id) = rest.parse::<u32>() {
            return Some(SingleConditionNode::SpellKnown(SpellKnownConditionNode {
                spell_id: id,
            }));
        }
    }

    // a123456 - aura active
    if let Some(rest) = s.strip_prefix('a') {
        if let Ok(id) = rest.parse::<u32>() {
            return Some(SingleConditionNode::Aura(AuraConditionNode { aura_id: id }));
        }
    }

    // c7 - class check
    if let Some(rest) = s.strip_prefix('c') {
        if let Ok(id) = rest.parse::<u32>() {
            return Some(SingleConditionNode::Class(ClassConditionNode { class_id: id }));
        }
    }

    // pc999 - player condition
    if let Some(rest) = s.strip_prefix("pc") {
        if let Ok(id) = rest.parse::<u32>() {
            return Some(SingleConditionNode::PlayerCondition(PlayerConditionNode {
                condition_id: id,
            }));
        }
    }

    None
}

fn parse_cond_func_call(s: &str) -> SingleConditionNode {
    // $gt($s1,5) format
    // Find function name between $ and (
    let rest = s.strip_prefix('$').unwrap_or(s);
    let paren_idx = rest.find('(').unwrap_or(rest.len());
    let func_name = rest[..paren_idx].to_string();

    // Extract args between ( and )
    let args_str = if paren_idx < rest.len() {
        let inner = &rest[paren_idx + 1..];
        inner.strip_suffix(')').unwrap_or(inner)
    } else {
        ""
    };

    // Parse args as expressions
    let mut args = Vec::new();
    if !args_str.is_empty() {
        let mut expr_parser = ExprParser::new(args_str);
        if let Some(expr) = expr_parser.parse_expression() {
            args.push(expr);
        }
        while matches!(expr_parser.peek(), Some(ExprToken::Comma)) {
            expr_parser.advance();
            if let Some(expr) = expr_parser.parse_expression() {
                args.push(expr);
            }
        }
    }

    SingleConditionNode::Expression(ExpressionConditionNode { func_name, args })
}
