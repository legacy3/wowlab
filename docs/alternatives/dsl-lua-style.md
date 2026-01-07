# Lua-Style DSL for Rotation Scripting

A custom domain-specific language with Lua-like syntax that compiles to native code via Cranelift JIT. This is NOT running Lua - it's a purpose-built DSL that looks familiar to WoW addon authors.

## Executive Summary

This document specifies a Lua-inspired DSL for writing rotation scripts that compile directly to the `JitCondition`/`JitEntry` structures for native code generation. The syntax mirrors Lua/WoW addon patterns while being statically typed and optimized for rotation logic.

**Key Features:**
- Familiar syntax for WoW addon developers
- Compiles to native machine code via Cranelift
- Zero runtime interpretation overhead
- Type-safe with compile-time validation
- ~5-20ns per rotation evaluation

---

## Target Compilation Structure

The DSL compiles to these Rust structures:

```rust
pub enum JitCondition {
    CooldownReady(u8),           // Spell index: cooldown remaining <= 0
    ChargesGe(u8, u8),           // Spell index, min charges
    FocusGe(f32),                // Focus >= threshold
    AuraActive(u8),              // Aura index: is buff/debuff active
    AuraRemainingLe(u8, f32),    // Aura index, max remaining seconds
    TargetHealthLt(f32),         // Target health < percentage (0.0-1.0)
    And(Box<JitCondition>, Box<JitCondition>),
    Or(Box<JitCondition>, Box<JitCondition>),
    Not(Box<JitCondition>),
    True,                        // Always true (unconditional)
}

pub struct JitEntry {
    pub condition: JitCondition,
    pub spell_id: u8,            // Spell to cast if condition is true
}
```

---

## Full Syntax Specification

### 1. Program Structure

```lua
-- Rotation definition
rotation "bm_hunter_st"

-- Spell declarations (maps names to u8 indices)
spell bestial_wrath = 0
spell kill_command = 1
spell barbed_shot = 2
spell cobra_shot = 3

-- Aura declarations (maps names to u8 indices)
aura frenzy = 0
aura bestial_wrath = 1

-- Priority list (evaluated top to bottom)
function rotation()
    -- Priority entries here
end
```

### 2. Condition Expressions

#### Cooldown Checks

```lua
-- CooldownReady(spell_index)
Cooldown("bestial_wrath"):IsReady()
Cooldown("kill_command"):IsReady()

-- Shorthand form
CD("bestial_wrath"):Ready()
```

#### Charge Checks

```lua
-- ChargesGe(spell_index, min_charges)
Charges("barbed_shot") >= 1
Charges("barbed_shot") >= 2

-- Method form
Charges("barbed_shot"):AtLeast(1)
```

#### Resource Checks

```lua
-- FocusGe(threshold)
Focus >= 30
Focus >= 35.0

-- Other resources (future extension)
Mana >= 1000
Rage >= 50
```

#### Aura/Buff Checks

```lua
-- AuraActive(aura_index)
Aura("frenzy"):IsActive()
Buff("frenzy"):IsActive()

-- AuraRemainingLe(aura_index, max_seconds)
Aura("frenzy"):Remaining() <= 2.0
Aura("frenzy"):Remaining() <= 1.5

-- Negation (Not + AuraActive)
not Aura("frenzy"):IsActive()
```

#### Target Checks

```lua
-- TargetHealthLt(percentage)
Target:HealthPct() < 0.20
Target:HealthPct() < 0.35
```

### 3. Logical Operators

```lua
-- And(left, right)
Cooldown("kill_command"):IsReady() and Focus >= 30

-- Or(left, right)
Charges("barbed_shot") >= 2 or Aura("frenzy"):Remaining() <= 1.5

-- Not(condition)
not Aura("frenzy"):IsActive()

-- Complex combinations
(Cooldown("kill_command"):IsReady() and Focus >= 30) or
(Charges("barbed_shot") >= 1 and not Aura("frenzy"):IsActive())
```

### 4. Actions

```lua
-- Cast spell (returns from function)
return Cast("bestial_wrath")
return Cast("kill_command")

-- Wait for GCD (fallback)
return WaitGCD()

-- Pool resources (optional extension)
return Pool("aimed_shot", 35)
```

### 5. Control Flow

```lua
-- Simple if
if Cooldown("bestial_wrath"):IsReady() then
    return Cast("bestial_wrath")
end

-- If-elseif chain
if Cooldown("bestial_wrath"):IsReady() then
    return Cast("bestial_wrath")
elseif Cooldown("kill_command"):IsReady() and Focus >= 30 then
    return Cast("kill_command")
elseif Charges("barbed_shot") >= 1 then
    return Cast("barbed_shot")
end

-- Default fallback
return WaitGCD()
```

### 6. Comments

```lua
-- Single line comment
--[[ Multi-line
     comment ]]
```

---

## Complete BM Hunter Rotation Example

```lua
-- Beast Mastery Hunter - Single Target
rotation "bm_hunter_st"

-- Spell indices (must match engine's SpellIdx enum)
spell bestial_wrath = 0
spell kill_command = 1
spell barbed_shot = 2
spell cobra_shot = 3
spell dire_beast = 4

-- Aura indices (must match engine's AuraIdx enum)
aura frenzy = 0
aura bestial_wrath = 1
aura barbed_shot = 2

function rotation()
    -- Priority 1: Major cooldown on CD
    if Cooldown("bestial_wrath"):IsReady() then
        return Cast("bestial_wrath")

    -- Priority 2: Kill Command (core rotational)
    elseif Cooldown("kill_command"):IsReady() and Focus >= 30 then
        return Cast("kill_command")

    -- Priority 3: Barbed Shot to maintain Frenzy or use charges
    elseif Charges("barbed_shot") >= 1 and
           (Aura("frenzy"):Remaining() <= 2.0 or not Aura("frenzy"):IsActive()) then
        return Cast("barbed_shot")

    -- Priority 4: Barbed Shot if capped on charges
    elseif Charges("barbed_shot") >= 2 then
        return Cast("barbed_shot")

    -- Priority 5: Dire Beast if talented and ready
    elseif Cooldown("dire_beast"):IsReady() then
        return Cast("dire_beast")

    -- Priority 6: Cobra Shot as filler
    elseif Focus >= 35 then
        return Cast("cobra_shot")
    end

    -- Default: Wait for GCD
    return WaitGCD()
end
```

**Compiles to:**

```rust
vec![
    // Priority 1: Bestial Wrath
    JitEntry {
        condition: JitCondition::CooldownReady(0),
        spell_id: 0,
    },
    // Priority 2: Kill Command
    JitEntry {
        condition: JitCondition::And(
            Box::new(JitCondition::CooldownReady(1)),
            Box::new(JitCondition::FocusGe(30.0)),
        ),
        spell_id: 1,
    },
    // Priority 3: Barbed Shot (frenzy management)
    JitEntry {
        condition: JitCondition::And(
            Box::new(JitCondition::ChargesGe(2, 1)),
            Box::new(JitCondition::Or(
                Box::new(JitCondition::AuraRemainingLe(0, 2.0)),
                Box::new(JitCondition::Not(
                    Box::new(JitCondition::AuraActive(0)),
                )),
            )),
        ),
        spell_id: 2,
    },
    // Priority 4: Barbed Shot (capped charges)
    JitEntry {
        condition: JitCondition::ChargesGe(2, 2),
        spell_id: 2,
    },
    // Priority 5: Dire Beast
    JitEntry {
        condition: JitCondition::CooldownReady(4),
        spell_id: 4,
    },
    // Priority 6: Cobra Shot filler
    JitEntry {
        condition: JitCondition::FocusGe(35.0),
        spell_id: 3,
    },
    // Default: WaitGCD (spell_id 255 = special)
    JitEntry {
        condition: JitCondition::True,
        spell_id: 255,
    },
]
```

---

## Complete MM Hunter Rotation Example

```lua
-- Marksmanship Hunter - Single Target
rotation "mm_hunter_st"

-- Spell indices
spell aimed_shot = 0
spell rapid_fire = 1
spell arcane_shot = 2
spell steady_shot = 3
spell trueshot = 4
spell kill_shot = 5
spell multishot = 6

-- Aura indices
aura precise_shots = 0
aura trueshot = 1
aura trick_shots = 2

function rotation()
    -- Priority 1: Trueshot (major cooldown)
    if Cooldown("trueshot"):IsReady() then
        return Cast("trueshot")

    -- Priority 2: Aimed Shot (primary damage)
    elseif Cooldown("aimed_shot"):IsReady() and Focus >= 35 then
        return Cast("aimed_shot")

    -- Priority 3: Rapid Fire on cooldown
    elseif Cooldown("rapid_fire"):IsReady() then
        return Cast("rapid_fire")

    -- Priority 4: Kill Shot in execute range
    elseif Target:HealthPct() < 0.20 and Cooldown("kill_shot"):IsReady() and Focus >= 10 then
        return Cast("kill_shot")

    -- Priority 5: Arcane Shot to consume Precise Shots
    elseif Aura("precise_shots"):IsActive() and Focus >= 20 then
        return Cast("arcane_shot")

    -- Priority 6: Steady Shot to generate Focus
    elseif Focus < 70 then
        return Cast("steady_shot")

    -- Priority 7: Arcane Shot as high-focus filler
    elseif Focus >= 60 then
        return Cast("arcane_shot")
    end

    -- Default: Steady Shot (focus generator)
    return Cast("steady_shot")
end
```

**Compiles to:**

```rust
vec![
    // Priority 1: Trueshot
    JitEntry {
        condition: JitCondition::CooldownReady(4),
        spell_id: 4,
    },
    // Priority 2: Aimed Shot
    JitEntry {
        condition: JitCondition::And(
            Box::new(JitCondition::CooldownReady(0)),
            Box::new(JitCondition::FocusGe(35.0)),
        ),
        spell_id: 0,
    },
    // Priority 3: Rapid Fire
    JitEntry {
        condition: JitCondition::CooldownReady(1),
        spell_id: 1,
    },
    // Priority 4: Kill Shot (execute)
    JitEntry {
        condition: JitCondition::And(
            Box::new(JitCondition::TargetHealthLt(0.20)),
            Box::new(JitCondition::And(
                Box::new(JitCondition::CooldownReady(5)),
                Box::new(JitCondition::FocusGe(10.0)),
            )),
        ),
        spell_id: 5,
    },
    // Priority 5: Arcane Shot (Precise Shots)
    JitEntry {
        condition: JitCondition::And(
            Box::new(JitCondition::AuraActive(0)),
            Box::new(JitCondition::FocusGe(20.0)),
        ),
        spell_id: 2,
    },
    // Priority 6: Steady Shot (focus gen)
    JitEntry {
        condition: JitCondition::Not(
            Box::new(JitCondition::FocusGe(70.0)),
        ),
        spell_id: 3,
    },
    // Priority 7: Arcane Shot (filler)
    JitEntry {
        condition: JitCondition::FocusGe(60.0),
        spell_id: 2,
    },
    // Default: Steady Shot
    JitEntry {
        condition: JitCondition::True,
        spell_id: 3,
    },
]
```

---

## Condition Mapping Reference

| DSL Syntax | JitCondition Variant |
|------------|---------------------|
| `Cooldown("x"):IsReady()` | `CooldownReady(spell_idx)` |
| `Charges("x") >= n` | `ChargesGe(spell_idx, n)` |
| `Focus >= n` | `FocusGe(n)` |
| `Aura("x"):IsActive()` | `AuraActive(aura_idx)` |
| `Aura("x"):Remaining() <= n` | `AuraRemainingLe(aura_idx, n)` |
| `Target:HealthPct() < n` | `TargetHealthLt(n)` |
| `a and b` | `And(Box::new(a), Box::new(b))` |
| `a or b` | `Or(Box::new(a), Box::new(b))` |
| `not a` | `Not(Box::new(a))` |
| (no condition / always) | `True` |

---

## Parser Implementation

### Grammar (EBNF-style)

```ebnf
program       = { declaration } "function" "rotation" "(" ")" block "end" ;
declaration   = spell_decl | aura_decl | rotation_decl ;
rotation_decl = "rotation" STRING ;
spell_decl    = "spell" IDENT "=" NUMBER ;
aura_decl     = "aura" IDENT "=" NUMBER ;

block         = { statement } ;
statement     = if_stmt | return_stmt ;
if_stmt       = "if" expr "then" block { "elseif" expr "then" block } [ "else" block ] "end" ;
return_stmt   = "return" action ;

action        = "Cast" "(" STRING ")" | "WaitGCD" "(" ")" ;

expr          = or_expr ;
or_expr       = and_expr { "or" and_expr } ;
and_expr      = not_expr { "and" not_expr } ;
not_expr      = "not" not_expr | comparison ;
comparison    = primary [ comp_op primary ] ;
comp_op       = ">=" | "<=" | "<" | ">" | "==" | "!=" ;

primary       = "(" expr ")"
              | cooldown_check
              | charges_check
              | focus_check
              | aura_check
              | target_check
              | NUMBER ;

cooldown_check = ( "Cooldown" | "CD" ) "(" STRING ")" ":" ( "IsReady" | "Ready" ) "(" ")" ;
charges_check  = "Charges" "(" STRING ")" ;
focus_check    = "Focus" ;
aura_check     = ( "Aura" | "Buff" | "Debuff" ) "(" STRING ")" ":" method_call ;
target_check   = "Target" ":" "HealthPct" "(" ")" ;
method_call    = "IsActive" "(" ")" | "Remaining" "(" ")" ;
```

### Lexer Implementation Sketch

```rust
#[derive(Debug, Clone, PartialEq)]
pub enum Token {
    // Keywords
    Rotation, Function, End, If, Then, Elseif, Else, Return,
    And, Or, Not,
    Spell, Aura,

    // Built-ins
    Cooldown, CD, Charges, Focus, Buff, Debuff, Target, Cast, WaitGCD,
    IsReady, Ready, IsActive, Remaining, HealthPct, AtLeast,

    // Operators
    Colon, LParen, RParen, Eq, Ge, Le, Lt, Gt, Ne,

    // Literals
    String(String),
    Number(f32),
    Ident(String),

    // Misc
    Assign,  // =
    Eof,
}

pub struct Lexer<'a> {
    input: &'a str,
    pos: usize,
}

impl<'a> Lexer<'a> {
    pub fn next_token(&mut self) -> Result<Token, LexError> {
        self.skip_whitespace_and_comments();

        if self.pos >= self.input.len() {
            return Ok(Token::Eof);
        }

        let c = self.current_char();

        match c {
            '(' => { self.advance(); Ok(Token::LParen) }
            ')' => { self.advance(); Ok(Token::RParen) }
            ':' => { self.advance(); Ok(Token::Colon) }
            '=' => {
                self.advance();
                if self.current_char() == '=' {
                    self.advance();
                    Ok(Token::Eq)
                } else {
                    Ok(Token::Assign)
                }
            }
            '>' => {
                self.advance();
                if self.current_char() == '=' {
                    self.advance();
                    Ok(Token::Ge)
                } else {
                    Ok(Token::Gt)
                }
            }
            '<' => {
                self.advance();
                if self.current_char() == '=' {
                    self.advance();
                    Ok(Token::Le)
                } else {
                    Ok(Token::Lt)
                }
            }
            '!' if self.peek_char() == '=' => {
                self.advance(); self.advance();
                Ok(Token::Ne)
            }
            '"' => self.read_string(),
            c if c.is_ascii_digit() => self.read_number(),
            c if c.is_ascii_alphabetic() || c == '_' => self.read_identifier(),
            _ => Err(LexError::UnexpectedChar(c)),
        }
    }

    fn read_identifier(&mut self) -> Result<Token, LexError> {
        let start = self.pos;
        while self.pos < self.input.len() &&
              (self.current_char().is_ascii_alphanumeric() || self.current_char() == '_') {
            self.advance();
        }

        let ident = &self.input[start..self.pos];

        // Map to keyword or return as identifier
        Ok(match ident {
            "rotation" => Token::Rotation,
            "function" => Token::Function,
            "end" => Token::End,
            "if" => Token::If,
            "then" => Token::Then,
            "elseif" => Token::Elseif,
            "else" => Token::Else,
            "return" => Token::Return,
            "and" => Token::And,
            "or" => Token::Or,
            "not" => Token::Not,
            "spell" => Token::Spell,
            "aura" => Token::Aura,
            "Cooldown" => Token::Cooldown,
            "CD" => Token::CD,
            "Charges" => Token::Charges,
            "Focus" => Token::Focus,
            "Aura" | "Buff" => Token::Buff,
            "Debuff" => Token::Debuff,
            "Target" => Token::Target,
            "Cast" => Token::Cast,
            "WaitGCD" => Token::WaitGCD,
            "IsReady" => Token::IsReady,
            "Ready" => Token::Ready,
            "IsActive" => Token::IsActive,
            "Remaining" => Token::Remaining,
            "HealthPct" => Token::HealthPct,
            "AtLeast" => Token::AtLeast,
            _ => Token::Ident(ident.to_string()),
        })
    }

    fn skip_whitespace_and_comments(&mut self) {
        while self.pos < self.input.len() {
            let c = self.current_char();
            if c.is_whitespace() {
                self.advance();
            } else if c == '-' && self.peek_char() == '-' {
                // Skip to end of line
                while self.pos < self.input.len() && self.current_char() != '\n' {
                    self.advance();
                }
            } else {
                break;
            }
        }
    }
}
```

### Parser Implementation Sketch

```rust
pub struct Parser<'a> {
    lexer: Lexer<'a>,
    current: Token,
    spell_map: HashMap<String, u8>,
    aura_map: HashMap<String, u8>,
}

#[derive(Debug)]
pub struct Rotation {
    pub name: String,
    pub entries: Vec<JitEntry>,
}

impl<'a> Parser<'a> {
    pub fn parse(&mut self) -> Result<Rotation, ParseError> {
        let mut name = String::new();

        // Parse declarations
        loop {
            match &self.current {
                Token::Rotation => {
                    self.advance()?;
                    if let Token::String(s) = &self.current {
                        name = s.clone();
                        self.advance()?;
                    }
                }
                Token::Spell => {
                    self.advance()?;
                    let ident = self.expect_ident()?;
                    self.expect(Token::Assign)?;
                    let idx = self.expect_number()? as u8;
                    self.spell_map.insert(ident, idx);
                }
                Token::Aura => {
                    self.advance()?;
                    let ident = self.expect_ident()?;
                    self.expect(Token::Assign)?;
                    let idx = self.expect_number()? as u8;
                    self.aura_map.insert(ident, idx);
                }
                Token::Function => break,
                _ => return Err(ParseError::UnexpectedToken),
            }
        }

        // Parse function rotation()
        self.expect(Token::Function)?;
        self.expect_ident_eq("rotation")?;
        self.expect(Token::LParen)?;
        self.expect(Token::RParen)?;

        // Parse body
        let entries = self.parse_block()?;

        self.expect(Token::End)?;

        Ok(Rotation { name, entries })
    }

    fn parse_block(&mut self) -> Result<Vec<JitEntry>, ParseError> {
        let mut entries = Vec::new();

        while self.current != Token::End && self.current != Token::Elseif &&
              self.current != Token::Else && self.current != Token::Eof {
            match &self.current {
                Token::If => {
                    entries.extend(self.parse_if_chain()?);
                }
                Token::Return => {
                    let entry = self.parse_return()?;
                    entries.push(entry);
                }
                _ => return Err(ParseError::UnexpectedToken),
            }
        }

        Ok(entries)
    }

    fn parse_if_chain(&mut self) -> Result<Vec<JitEntry>, ParseError> {
        let mut entries = Vec::new();

        // First 'if'
        self.expect(Token::If)?;
        let condition = self.parse_expr()?;
        self.expect(Token::Then)?;

        // Parse body (should be a single return for simple rotations)
        let body_entries = self.parse_block()?;

        // For simple case: if cond then return Cast("x") end
        // We want: JitEntry { condition, spell_id }
        if let Some(first) = body_entries.first() {
            entries.push(JitEntry {
                condition,
                spell_id: first.spell_id,
            });
        }

        // Handle elseif chain
        while self.current == Token::Elseif {
            self.advance()?;
            let elif_cond = self.parse_expr()?;
            self.expect(Token::Then)?;
            let elif_body = self.parse_block()?;

            if let Some(first) = elif_body.first() {
                entries.push(JitEntry {
                    condition: elif_cond,
                    spell_id: first.spell_id,
                });
            }
        }

        // Handle else
        if self.current == Token::Else {
            self.advance()?;
            let else_body = self.parse_block()?;
            // Else is unconditional
            if let Some(first) = else_body.first() {
                entries.push(JitEntry {
                    condition: JitCondition::True,
                    spell_id: first.spell_id,
                });
            }
        }

        self.expect(Token::End)?;

        Ok(entries)
    }

    fn parse_expr(&mut self) -> Result<JitCondition, ParseError> {
        self.parse_or_expr()
    }

    fn parse_or_expr(&mut self) -> Result<JitCondition, ParseError> {
        let mut left = self.parse_and_expr()?;

        while self.current == Token::Or {
            self.advance()?;
            let right = self.parse_and_expr()?;
            left = JitCondition::Or(Box::new(left), Box::new(right));
        }

        Ok(left)
    }

    fn parse_and_expr(&mut self) -> Result<JitCondition, ParseError> {
        let mut left = self.parse_not_expr()?;

        while self.current == Token::And {
            self.advance()?;
            let right = self.parse_not_expr()?;
            left = JitCondition::And(Box::new(left), Box::new(right));
        }

        Ok(left)
    }

    fn parse_not_expr(&mut self) -> Result<JitCondition, ParseError> {
        if self.current == Token::Not {
            self.advance()?;
            let expr = self.parse_not_expr()?;
            return Ok(JitCondition::Not(Box::new(expr)));
        }

        self.parse_comparison()
    }

    fn parse_comparison(&mut self) -> Result<JitCondition, ParseError> {
        let left = self.parse_primary()?;

        // Check for comparison operators
        match &self.current {
            Token::Ge => {
                self.advance()?;
                let right = self.expect_number()?;
                // Left must be Focus or Charges
                match left {
                    PrimaryExpr::Focus => Ok(JitCondition::FocusGe(right)),
                    PrimaryExpr::Charges(idx) => Ok(JitCondition::ChargesGe(idx, right as u8)),
                    _ => Err(ParseError::InvalidComparison),
                }
            }
            Token::Le => {
                self.advance()?;
                let right = self.expect_number()?;
                match left {
                    PrimaryExpr::AuraRemaining(idx) => Ok(JitCondition::AuraRemainingLe(idx, right)),
                    _ => Err(ParseError::InvalidComparison),
                }
            }
            Token::Lt => {
                self.advance()?;
                let right = self.expect_number()?;
                match left {
                    PrimaryExpr::TargetHealth => Ok(JitCondition::TargetHealthLt(right)),
                    _ => Err(ParseError::InvalidComparison),
                }
            }
            _ => {
                // No comparison operator - must be a boolean expression
                match left {
                    PrimaryExpr::CooldownReady(idx) => Ok(JitCondition::CooldownReady(idx)),
                    PrimaryExpr::AuraActive(idx) => Ok(JitCondition::AuraActive(idx)),
                    PrimaryExpr::Condition(c) => Ok(c),
                    _ => Err(ParseError::ExpectedBoolean),
                }
            }
        }
    }

    fn parse_primary(&mut self) -> Result<PrimaryExpr, ParseError> {
        match &self.current {
            Token::LParen => {
                self.advance()?;
                let expr = self.parse_expr()?;
                self.expect(Token::RParen)?;
                Ok(PrimaryExpr::Condition(expr))
            }
            Token::Cooldown | Token::CD => {
                self.advance()?;
                self.expect(Token::LParen)?;
                let spell = self.expect_string()?;
                self.expect(Token::RParen)?;
                self.expect(Token::Colon)?;

                // IsReady() or Ready()
                match &self.current {
                    Token::IsReady | Token::Ready => {
                        self.advance()?;
                        self.expect(Token::LParen)?;
                        self.expect(Token::RParen)?;
                        let idx = self.spell_map.get(&spell)
                            .copied()
                            .ok_or(ParseError::UnknownSpell(spell))?;
                        Ok(PrimaryExpr::CooldownReady(idx))
                    }
                    _ => Err(ParseError::ExpectedMethod),
                }
            }
            Token::Charges => {
                self.advance()?;
                self.expect(Token::LParen)?;
                let spell = self.expect_string()?;
                self.expect(Token::RParen)?;
                let idx = self.spell_map.get(&spell)
                    .copied()
                    .ok_or(ParseError::UnknownSpell(spell))?;
                Ok(PrimaryExpr::Charges(idx))
            }
            Token::Focus => {
                self.advance()?;
                Ok(PrimaryExpr::Focus)
            }
            Token::Buff | Token::Debuff => {
                self.advance()?;
                self.expect(Token::LParen)?;
                let aura = self.expect_string()?;
                self.expect(Token::RParen)?;
                self.expect(Token::Colon)?;

                let idx = self.aura_map.get(&aura)
                    .copied()
                    .ok_or(ParseError::UnknownAura(aura))?;

                match &self.current {
                    Token::IsActive => {
                        self.advance()?;
                        self.expect(Token::LParen)?;
                        self.expect(Token::RParen)?;
                        Ok(PrimaryExpr::AuraActive(idx))
                    }
                    Token::Remaining => {
                        self.advance()?;
                        self.expect(Token::LParen)?;
                        self.expect(Token::RParen)?;
                        Ok(PrimaryExpr::AuraRemaining(idx))
                    }
                    _ => Err(ParseError::ExpectedMethod),
                }
            }
            Token::Target => {
                self.advance()?;
                self.expect(Token::Colon)?;
                self.expect(Token::HealthPct)?;
                self.expect(Token::LParen)?;
                self.expect(Token::RParen)?;
                Ok(PrimaryExpr::TargetHealth)
            }
            _ => Err(ParseError::UnexpectedToken),
        }
    }
}

#[derive(Debug)]
enum PrimaryExpr {
    Focus,
    Charges(u8),
    CooldownReady(u8),
    AuraActive(u8),
    AuraRemaining(u8),
    TargetHealth,
    Condition(JitCondition),
}
```

### Code Generator

```rust
impl Rotation {
    /// Generate Cranelift IR from the parsed rotation
    pub fn compile_to_cranelift(&self, builder: &mut FunctionBuilder) -> Result<(), CompileError> {
        // Create entry block
        let entry = builder.create_block();
        builder.switch_to_block(entry);

        // State pointer is passed as first argument
        let state_ptr = builder.block_params(entry)[0];

        for (i, entry) in self.entries.iter().enumerate() {
            // Create block for this priority
            let check_block = builder.create_block();
            let next_block = builder.create_block();

            builder.switch_to_block(check_block);

            // Evaluate condition
            let cond_result = self.compile_condition(&entry.condition, builder, state_ptr)?;

            // Branch on result
            builder.ins().brif(cond_result, return_block, &[], next_block, &[]);

            // In return block: return spell_id
            builder.switch_to_block(return_block);
            let spell_id = builder.ins().iconst(types::I8, entry.spell_id as i64);
            builder.ins().return_(&[spell_id]);

            builder.switch_to_block(next_block);
        }

        // Default: return 255 (WaitGCD)
        let wait_gcd = builder.ins().iconst(types::I8, 255);
        builder.ins().return_(&[wait_gcd]);

        Ok(())
    }

    fn compile_condition(
        &self,
        cond: &JitCondition,
        builder: &mut FunctionBuilder,
        state_ptr: Value,
    ) -> Result<Value, CompileError> {
        match cond {
            JitCondition::CooldownReady(idx) => {
                // Load cooldown remaining from state
                let offset = COOLDOWN_OFFSET + (*idx as i32) * 4;
                let remaining = builder.ins().load(
                    types::F32,
                    MemFlags::new(),
                    state_ptr,
                    offset,
                );
                let zero = builder.ins().f32const(0.0);
                Ok(builder.ins().fcmp(FloatCC::LessThanOrEqual, remaining, zero))
            }
            JitCondition::ChargesGe(idx, min) => {
                let offset = CHARGES_OFFSET + (*idx as i32);
                let charges = builder.ins().load(
                    types::I8,
                    MemFlags::new(),
                    state_ptr,
                    offset,
                );
                let min_val = builder.ins().iconst(types::I8, *min as i64);
                Ok(builder.ins().icmp(IntCC::SignedGreaterThanOrEqual, charges, min_val))
            }
            JitCondition::FocusGe(threshold) => {
                let focus = builder.ins().load(
                    types::F32,
                    MemFlags::new(),
                    state_ptr,
                    FOCUS_OFFSET,
                );
                let thresh = builder.ins().f32const(*threshold);
                Ok(builder.ins().fcmp(FloatCC::GreaterThanOrEqual, focus, thresh))
            }
            JitCondition::AuraActive(idx) => {
                let offset = AURA_ACTIVE_OFFSET + (*idx as i32);
                let active = builder.ins().load(
                    types::I8,
                    MemFlags::new(),
                    state_ptr,
                    offset,
                );
                let zero = builder.ins().iconst(types::I8, 0);
                Ok(builder.ins().icmp(IntCC::NotEqual, active, zero))
            }
            JitCondition::AuraRemainingLe(idx, max_secs) => {
                let offset = AURA_REMAINING_OFFSET + (*idx as i32) * 4;
                let remaining = builder.ins().load(
                    types::F32,
                    MemFlags::new(),
                    state_ptr,
                    offset,
                );
                let max = builder.ins().f32const(*max_secs);
                Ok(builder.ins().fcmp(FloatCC::LessThanOrEqual, remaining, max))
            }
            JitCondition::TargetHealthLt(pct) => {
                let health = builder.ins().load(
                    types::F32,
                    MemFlags::new(),
                    state_ptr,
                    TARGET_HEALTH_OFFSET,
                );
                let threshold = builder.ins().f32const(*pct);
                Ok(builder.ins().fcmp(FloatCC::LessThan, health, threshold))
            }
            JitCondition::And(left, right) => {
                let l = self.compile_condition(left, builder, state_ptr)?;
                let r = self.compile_condition(right, builder, state_ptr)?;
                Ok(builder.ins().band(l, r))
            }
            JitCondition::Or(left, right) => {
                let l = self.compile_condition(left, builder, state_ptr)?;
                let r = self.compile_condition(right, builder, state_ptr)?;
                Ok(builder.ins().bor(l, r))
            }
            JitCondition::Not(inner) => {
                let v = self.compile_condition(inner, builder, state_ptr)?;
                let one = builder.ins().iconst(types::I8, 1);
                Ok(builder.ins().bxor(v, one))
            }
            JitCondition::True => {
                Ok(builder.ins().iconst(types::I8, 1))
            }
        }
    }
}
```

---

## Pros and Cons

### Pros

| Advantage | Description |
|-----------|-------------|
| **Familiar syntax** | WoW addon authors instantly recognize the Lua-like patterns |
| **Native performance** | Compiles to machine code via Cranelift (~5-20ns per eval) |
| **Type safety** | Spell/aura names validated at compile time |
| **No runtime overhead** | No interpreter, no GC, no dynamic dispatch |
| **Readable** | Priority lists look like natural language |
| **Portable** | Same syntax works across all specs |
| **Debuggable** | Clear mapping from source to IR to machine code |

### Cons

| Disadvantage | Description |
|--------------|-------------|
| **Not real Lua** | Can't use Lua libraries or existing WoW addon code directly |
| **Limited expressiveness** | No loops, no functions, no variables (by design) |
| **Custom tooling needed** | No IDE support, syntax highlighting, or debugger |
| **Learning curve** | Despite familiar syntax, the limitations require adjustment |
| **Maintenance burden** | Custom parser/compiler to maintain |
| **Fixed condition types** | Adding new condition types requires DSL changes |

### Comparison with Alternatives

| Approach | Performance | WoW Familiarity | Flexibility | Impl. Effort |
|----------|-------------|-----------------|-------------|--------------|
| **Lua-Style DSL** | ~5-20ns | High | Low | Medium (3-4 weeks) |
| Native Rust Macros | ~5-20ns | Low | Medium | Medium (2-3 weeks) |
| LuaJIT (actual Lua) | ~50-100ns | Very High | High | Low (1-2 weeks) |
| Custom Bytecode VM | ~50-100ns | Medium | Medium | High (4-6 weeks) |
| Rhai (current) | ~2000ns | Medium | Very High | Already done |

---

## Future Extensions

### Potential Syntax Additions

```lua
-- Talent checks (compile to different entries at load time)
if Talent("killer_instinct") then
    -- Different priority when talented
end

-- Local variables for clarity (evaluated once, inlined)
local kc_ready = Cooldown("kill_command"):IsReady()
if kc_ready and Focus >= 30 then
    return Cast("kill_command")
end

-- Macro-like shorthand
#define FRENZY_LOW Aura("frenzy"):Remaining() <= 2.0

if FRENZY_LOW then
    return Cast("barbed_shot")
end
```

### Potential Condition Extensions

```rust
// Add to JitCondition:
ComboPointsGe(u8),          // For rogues
RunesGe(u8),                // For death knights
HolyPowerGe(u8),            // For paladins
SoulShardsGe(u8),           // For warlocks
HasPet,                     // Pet is alive
InMeleeRange,               // Target in melee
MovementSpeed(f32),         // Player moving
```

---

## Implementation Timeline

| Phase | Tasks | Duration |
|-------|-------|----------|
| **1. Lexer** | Token definitions, lexer implementation, tests | 2-3 days |
| **2. Parser** | Grammar, AST types, parser implementation | 3-4 days |
| **3. Semantic Analysis** | Spell/aura resolution, type checking | 2-3 days |
| **4. IR Generation** | JitCondition/JitEntry generation | 2-3 days |
| **5. Cranelift Integration** | Code generation, state layout | 3-4 days |
| **6. Testing** | Unit tests, integration tests, benchmarks | 3-4 days |
| **7. Documentation** | User guide, examples, error messages | 2-3 days |
| **Total** | | **3-4 weeks** |

---

## Conclusion

The Lua-style DSL provides a compelling balance between familiarity for WoW addon authors and the performance requirements of high-iteration simulation. The syntax is immediately recognizable while the constraints (no loops, no general variables) guide users toward efficient rotation definitions.

The key insight is that rotation logic is fundamentally a priority list of condition-action pairs. By restricting the DSL to exactly this pattern, we can:

1. Guarantee compilation to efficient native code
2. Provide clear, actionable error messages
3. Enable static analysis of rotation behavior
4. Maintain a simple, maintainable implementation

For teams familiar with WoW addon development, this DSL offers the fastest path to productive rotation authoring while maintaining the performance characteristics required for millions of simulation iterations.
