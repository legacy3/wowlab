# S-Expression DSL for Rotation Scripting

## Executive Summary

This document proposes an S-expression (Lisp-like) syntax for defining rotation logic that compiles directly to the `JitCondition`/`JitEntry` structures used by the Cranelift JIT compiler. The key insight is that S-expressions have an almost 1:1 correspondence with algebraic data types (enums), making parsing trivial and the mapping to Rust structures transparent.

**Recommendation**: S-expression syntax offers the cleanest mapping to the JIT IR, with a parser implementable in ~100 lines of Rust. The syntax is unfamiliar to some users but extremely powerful for composition and tooling.

---

## Table of Contents

1. [Target Structures](#target-structures)
2. [Syntax Specification](#syntax-specification)
3. [BM Hunter Rotation Example](#bm-hunter-rotation-example)
4. [MM Hunter Rotation Example](#mm-hunter-rotation-example)
5. [Mapping S-Expressions to JitCondition](#mapping-s-expressions-to-jitcondition)
6. [Parser Implementation](#parser-implementation)
7. [Pros and Cons](#pros-and-cons)
8. [Comparison with Other Syntaxes](#comparison-with-other-syntaxes)

---

## Target Structures

The DSL compiles to these Rust structures from the Cranelift JIT backend:

```rust
pub enum JitCondition {
    CooldownReady(u8),
    ChargesGe(u8, u8),
    FocusGe(f32),
    AuraActive(u8),
    AuraRemainingLe(u8, f32),
    TargetHealthLt(f32),
    And(Box<JitCondition>, Box<JitCondition>),
    Or(Box<JitCondition>, Box<JitCondition>),
    Not(Box<JitCondition>),
    True,
}

pub struct JitEntry {
    pub condition: JitCondition,
    pub spell_id: u8,
}
```

---

## Syntax Specification

### Grammar (EBNF)

```ebnf
rotation     = "(" "rotation" identifier entry* ")" ;
entry        = action | fallback ;
action       = "(" "action" identifier condition ")" ;
fallback     = "(" "fallback" identifier ")" ;

condition    = atom | compound ;
atom         = cooldown_ready | charges_ge | focus_ge
             | aura_active | aura_remaining_le | target_health_lt
             | "true" ;
compound     = and_expr | or_expr | not_expr ;

cooldown_ready    = "(" "cooldown-ready" identifier ")" ;
charges_ge        = "(" "charges-ge" identifier integer ")" ;
focus_ge          = "(" "focus-ge" number ")" ;
aura_active       = "(" "aura-active" identifier ")" ;
aura_remaining_le = "(" "aura-remaining-le" identifier number ")" ;
target_health_lt  = "(" "target-health-lt" number ")" ;

and_expr     = "(" "and" condition condition ")" ;
or_expr      = "(" "or" condition condition ")" ;
not_expr     = "(" "not" condition ")" ;

identifier   = letter { letter | digit | "_" | "-" } ;
integer      = digit { digit } ;
number       = digit { digit } [ "." digit { digit } ] ;
```

### Syntax Elements

| Element | S-Expression | JitCondition Variant |
|---------|--------------|----------------------|
| Cooldown ready | `(cooldown-ready spell)` | `CooldownReady(id)` |
| Charges at least N | `(charges-ge spell N)` | `ChargesGe(id, N)` |
| Focus at least N | `(focus-ge N)` | `FocusGe(N)` |
| Aura is active | `(aura-active aura)` | `AuraActive(id)` |
| Aura remaining <= N | `(aura-remaining-le aura N)` | `AuraRemainingLe(id, N)` |
| Target health < N% | `(target-health-lt N)` | `TargetHealthLt(N)` |
| Logical AND | `(and cond1 cond2)` | `And(c1, c2)` |
| Logical OR | `(or cond1 cond2)` | `Or(c1, c2)` |
| Logical NOT | `(not cond)` | `Not(c)` |
| Always true | `true` | `True` |

### Comments

```lisp
; Single-line comments start with semicolon
(rotation example
  ; This is a comment
  (action spell (cooldown-ready spell)))
```

### Identifier Resolution

Spell and aura identifiers are resolved at compile time via a symbol table:

```lisp
; Identifiers map to u8 indices
bestial_wrath   -> 0
kill_command    -> 1
barbed_shot     -> 2
cobra_shot      -> 3
; etc.
```

---

## BM Hunter Rotation Example

```lisp
; Beast Mastery Hunter - Single Target Rotation
; Compiles to Vec<JitEntry> for Cranelift JIT

(rotation bm_hunter_st

  ; Priority 1: Major cooldown - Bestial Wrath on CD
  (action bestial_wrath
    (cooldown-ready bestial_wrath))

  ; Priority 2: Call of the Wild on CD
  (action call_of_the_wild
    (cooldown-ready call_of_the_wild))

  ; Priority 3: Kill Command - core rotational ability
  (action kill_command
    (and (cooldown-ready kill_command)
         (focus-ge 30)))

  ; Priority 4: Barbed Shot - maintain Frenzy stacks
  ; Cast if Frenzy is about to expire OR we have 2 charges
  (action barbed_shot
    (and (charges-ge barbed_shot 1)
         (or (aura-remaining-le frenzy 2.0)
             (not (aura-active frenzy)))))

  ; Priority 5: Barbed Shot at charge cap
  (action barbed_shot
    (charges-ge barbed_shot 2))

  ; Priority 6: Dire Beast on CD
  (action dire_beast
    (cooldown-ready dire_beast))

  ; Priority 7: Kill Shot in execute (target < 20%)
  (action kill_shot
    (and (cooldown-ready kill_shot)
         (target-health-lt 0.20)))

  ; Priority 8: Cobra Shot as filler with excess focus
  (action cobra_shot
    (and (focus-ge 50)
         (or (not (cooldown-ready kill_command))
             (focus-ge 90))))

  ; Fallback: Wait for GCD
  (fallback wait_gcd))
```

### Compiled Output

The above rotation compiles to:

```rust
vec![
    JitEntry {
        condition: CooldownReady(0), // bestial_wrath
        spell_id: 0,
    },
    JitEntry {
        condition: CooldownReady(1), // call_of_the_wild
        spell_id: 1,
    },
    JitEntry {
        condition: And(
            Box::new(CooldownReady(2)), // kill_command
            Box::new(FocusGe(30.0)),
        ),
        spell_id: 2,
    },
    JitEntry {
        condition: And(
            Box::new(ChargesGe(3, 1)), // barbed_shot
            Box::new(Or(
                Box::new(AuraRemainingLe(0, 2.0)), // frenzy
                Box::new(Not(Box::new(AuraActive(0)))),
            )),
        ),
        spell_id: 3,
    },
    JitEntry {
        condition: ChargesGe(3, 2), // barbed_shot at 2 charges
        spell_id: 3,
    },
    JitEntry {
        condition: CooldownReady(4), // dire_beast
        spell_id: 4,
    },
    JitEntry {
        condition: And(
            Box::new(CooldownReady(5)), // kill_shot
            Box::new(TargetHealthLt(0.20)),
        ),
        spell_id: 5,
    },
    JitEntry {
        condition: And(
            Box::new(FocusGe(50.0)),
            Box::new(Or(
                Box::new(Not(Box::new(CooldownReady(2)))), // kill_command not ready
                Box::new(FocusGe(90.0)),
            )),
        ),
        spell_id: 6, // cobra_shot
    },
    JitEntry {
        condition: True,
        spell_id: 255, // wait_gcd (special ID)
    },
]
```

---

## MM Hunter Rotation Example

```lisp
; Marksmanship Hunter - Single Target Rotation
; Focuses on Aimed Shot windows and Precise Shots procs

(rotation mm_hunter_st

  ; Priority 1: Trueshot - major cooldown
  (action trueshot
    (cooldown-ready trueshot))

  ; Priority 2: Aimed Shot with Trueshot active
  (action aimed_shot
    (and (cooldown-ready aimed_shot)
         (and (focus-ge 35)
              (aura-active trueshot))))

  ; Priority 3: Rapid Fire on cooldown
  (action rapid_fire
    (cooldown-ready rapid_fire))

  ; Priority 4: Aimed Shot - primary damage
  (action aimed_shot
    (and (cooldown-ready aimed_shot)
         (focus-ge 35)))

  ; Priority 5: Kill Shot in execute
  (action kill_shot
    (and (cooldown-ready kill_shot)
         (target-health-lt 0.20)))

  ; Priority 6: Arcane Shot to consume Precise Shots
  (action arcane_shot
    (and (aura-active precise_shots)
         (focus-ge 20)))

  ; Priority 7: Steady Shot to regenerate focus
  (action steady_shot
    (not (focus-ge 70)))

  ; Priority 8: Arcane Shot as filler
  (action arcane_shot
    (focus-ge 40))

  ; Fallback: Steady Shot
  (fallback steady_shot))
```

### MM Hunter with Volley (AoE Variant)

```lisp
; Marksmanship Hunter - AoE Rotation
(rotation mm_hunter_aoe

  ; Priority 1: Trueshot
  (action trueshot
    (cooldown-ready trueshot))

  ; Priority 2: Volley on cooldown
  (action volley
    (cooldown-ready volley))

  ; Priority 3: Multi-Shot to apply/maintain Trick Shots
  (action multi_shot
    (and (focus-ge 30)
         (or (not (aura-active trick_shots))
             (aura-remaining-le trick_shots 1.5))))

  ; Priority 4: Rapid Fire
  (action rapid_fire
    (cooldown-ready rapid_fire))

  ; Priority 5: Aimed Shot with Trick Shots
  (action aimed_shot
    (and (cooldown-ready aimed_shot)
         (and (focus-ge 35)
              (aura-active trick_shots))))

  ; Priority 6: Multi-Shot as filler
  (action multi_shot
    (focus-ge 40))

  ; Fallback: Steady Shot
  (fallback steady_shot))
```

---

## Mapping S-Expressions to JitCondition

The beauty of S-expressions is their direct correspondence to algebraic data types. Each S-expression form maps exactly to one `JitCondition` variant:

### Mapping Table

| S-Expression | JitCondition |
|--------------|--------------|
| `(cooldown-ready X)` | `CooldownReady(resolve(X))` |
| `(charges-ge X N)` | `ChargesGe(resolve(X), N)` |
| `(focus-ge N)` | `FocusGe(N)` |
| `(aura-active X)` | `AuraActive(resolve(X))` |
| `(aura-remaining-le X N)` | `AuraRemainingLe(resolve(X), N)` |
| `(target-health-lt N)` | `TargetHealthLt(N)` |
| `(and A B)` | `And(Box::new(A), Box::new(B))` |
| `(or A B)` | `Or(Box::new(A), Box::new(B))` |
| `(not A)` | `Not(Box::new(A))` |
| `true` | `True` |

### Structural Isomorphism

The S-expression AST is structurally isomorphic to `JitCondition`:

```rust
// S-expression AST (what parser produces)
enum SExpr {
    Atom(String),
    Number(f32),
    Integer(u8),
    List(Vec<SExpr>),
}

// Direct transformation - no intermediate representation needed
fn sexpr_to_condition(expr: &SExpr, symbols: &SymbolTable) -> JitCondition {
    match expr {
        SExpr::Atom(s) if s == "true" => JitCondition::True,

        SExpr::List(items) => {
            let op = items[0].as_atom().unwrap();
            match op.as_str() {
                "cooldown-ready" => {
                    let spell = symbols.resolve_spell(&items[1].as_atom().unwrap());
                    JitCondition::CooldownReady(spell)
                }
                "charges-ge" => {
                    let spell = symbols.resolve_spell(&items[1].as_atom().unwrap());
                    let count = items[2].as_integer().unwrap();
                    JitCondition::ChargesGe(spell, count)
                }
                "focus-ge" => {
                    let amount = items[1].as_number().unwrap();
                    JitCondition::FocusGe(amount)
                }
                "aura-active" => {
                    let aura = symbols.resolve_aura(&items[1].as_atom().unwrap());
                    JitCondition::AuraActive(aura)
                }
                "aura-remaining-le" => {
                    let aura = symbols.resolve_aura(&items[1].as_atom().unwrap());
                    let seconds = items[2].as_number().unwrap();
                    JitCondition::AuraRemainingLe(aura, seconds)
                }
                "target-health-lt" => {
                    let pct = items[1].as_number().unwrap();
                    JitCondition::TargetHealthLt(pct)
                }
                "and" => {
                    let left = sexpr_to_condition(&items[1], symbols);
                    let right = sexpr_to_condition(&items[2], symbols);
                    JitCondition::And(Box::new(left), Box::new(right))
                }
                "or" => {
                    let left = sexpr_to_condition(&items[1], symbols);
                    let right = sexpr_to_condition(&items[2], symbols);
                    JitCondition::Or(Box::new(left), Box::new(right))
                }
                "not" => {
                    let inner = sexpr_to_condition(&items[1], symbols);
                    JitCondition::Not(Box::new(inner))
                }
                _ => panic!("Unknown operator: {}", op),
            }
        }
        _ => panic!("Invalid condition expression"),
    }
}
```

---

## Parser Implementation

S-expression parsers are famously simple. Here's a complete implementation in ~100 lines:

### Tokenizer

```rust
#[derive(Debug, Clone, PartialEq)]
pub enum Token {
    LParen,
    RParen,
    Atom(String),
    Number(f32),
    Integer(u8),
}

pub struct Lexer<'a> {
    input: &'a str,
    pos: usize,
}

impl<'a> Lexer<'a> {
    pub fn new(input: &'a str) -> Self {
        Self { input, pos: 0 }
    }

    fn skip_whitespace_and_comments(&mut self) {
        let bytes = self.input.as_bytes();
        while self.pos < bytes.len() {
            match bytes[self.pos] {
                b' ' | b'\t' | b'\n' | b'\r' => self.pos += 1,
                b';' => {
                    // Skip to end of line
                    while self.pos < bytes.len() && bytes[self.pos] != b'\n' {
                        self.pos += 1;
                    }
                }
                _ => break,
            }
        }
    }

    pub fn next_token(&mut self) -> Option<Token> {
        self.skip_whitespace_and_comments();

        if self.pos >= self.input.len() {
            return None;
        }

        let bytes = self.input.as_bytes();
        match bytes[self.pos] {
            b'(' => {
                self.pos += 1;
                Some(Token::LParen)
            }
            b')' => {
                self.pos += 1;
                Some(Token::RParen)
            }
            b'0'..=b'9' | b'.' => {
                let start = self.pos;
                let mut has_dot = false;
                while self.pos < bytes.len() {
                    match bytes[self.pos] {
                        b'0'..=b'9' => self.pos += 1,
                        b'.' if !has_dot => {
                            has_dot = true;
                            self.pos += 1;
                        }
                        _ => break,
                    }
                }
                let s = &self.input[start..self.pos];
                if has_dot {
                    Some(Token::Number(s.parse().unwrap()))
                } else {
                    Some(Token::Integer(s.parse().unwrap()))
                }
            }
            _ => {
                let start = self.pos;
                while self.pos < bytes.len() {
                    match bytes[self.pos] {
                        b'(' | b')' | b' ' | b'\t' | b'\n' | b'\r' | b';' => break,
                        _ => self.pos += 1,
                    }
                }
                Some(Token::Atom(self.input[start..self.pos].to_string()))
            }
        }
    }
}
```

### Parser

```rust
#[derive(Debug, Clone)]
pub enum SExpr {
    Atom(String),
    Number(f32),
    Integer(u8),
    List(Vec<SExpr>),
}

impl SExpr {
    pub fn as_atom(&self) -> Option<&str> {
        match self {
            SExpr::Atom(s) => Some(s),
            _ => None,
        }
    }

    pub fn as_number(&self) -> Option<f32> {
        match self {
            SExpr::Number(n) => Some(*n),
            SExpr::Integer(n) => Some(*n as f32),
            _ => None,
        }
    }

    pub fn as_integer(&self) -> Option<u8> {
        match self {
            SExpr::Integer(n) => Some(*n),
            _ => None,
        }
    }
}

pub struct Parser<'a> {
    lexer: Lexer<'a>,
    current: Option<Token>,
}

impl<'a> Parser<'a> {
    pub fn new(input: &'a str) -> Self {
        let mut lexer = Lexer::new(input);
        let current = lexer.next_token();
        Self { lexer, current }
    }

    fn advance(&mut self) {
        self.current = self.lexer.next_token();
    }

    pub fn parse(&mut self) -> Result<SExpr, String> {
        match self.current.take() {
            Some(Token::LParen) => {
                self.advance();
                let mut items = Vec::new();

                loop {
                    match &self.current {
                        Some(Token::RParen) => {
                            self.advance();
                            return Ok(SExpr::List(items));
                        }
                        None => return Err("Unexpected end of input".to_string()),
                        _ => items.push(self.parse()?),
                    }
                }
            }
            Some(Token::Atom(s)) => {
                self.advance();
                Ok(SExpr::Atom(s))
            }
            Some(Token::Number(n)) => {
                self.advance();
                Ok(SExpr::Number(n))
            }
            Some(Token::Integer(n)) => {
                self.advance();
                Ok(SExpr::Integer(n))
            }
            Some(Token::RParen) => Err("Unexpected ')'".to_string()),
            None => Err("Unexpected end of input".to_string()),
        }
    }
}
```

### Complete Compiler

```rust
pub struct RotationCompiler {
    spell_symbols: HashMap<String, u8>,
    aura_symbols: HashMap<String, u8>,
}

impl RotationCompiler {
    pub fn new() -> Self {
        Self {
            spell_symbols: HashMap::new(),
            aura_symbols: HashMap::new(),
        }
    }

    pub fn add_spell(&mut self, name: &str, id: u8) {
        self.spell_symbols.insert(name.to_string(), id);
    }

    pub fn add_aura(&mut self, name: &str, id: u8) {
        self.aura_symbols.insert(name.to_string(), id);
    }

    pub fn compile(&self, source: &str) -> Result<Vec<JitEntry>, String> {
        let mut parser = Parser::new(source);
        let sexpr = parser.parse()?;

        self.compile_rotation(&sexpr)
    }

    fn compile_rotation(&self, expr: &SExpr) -> Result<Vec<JitEntry>, String> {
        let items = match expr {
            SExpr::List(items) => items,
            _ => return Err("Expected rotation definition".to_string()),
        };

        if items.get(0).and_then(|e| e.as_atom()) != Some("rotation") {
            return Err("Expected 'rotation' keyword".to_string());
        }

        // Skip rotation name (index 1)
        let mut entries = Vec::new();

        for item in items.iter().skip(2) {
            let entry = self.compile_entry(item)?;
            entries.push(entry);
        }

        Ok(entries)
    }

    fn compile_entry(&self, expr: &SExpr) -> Result<JitEntry, String> {
        let items = match expr {
            SExpr::List(items) => items,
            _ => return Err("Expected action or fallback".to_string()),
        };

        let keyword = items[0].as_atom().ok_or("Expected keyword")?;

        match keyword {
            "action" => {
                let spell_name = items[1].as_atom().ok_or("Expected spell name")?;
                let spell_id = self.spell_symbols.get(spell_name)
                    .copied()
                    .ok_or(format!("Unknown spell: {}", spell_name))?;
                let condition = self.compile_condition(&items[2])?;

                Ok(JitEntry { condition, spell_id })
            }
            "fallback" => {
                let spell_name = items[1].as_atom().ok_or("Expected spell name")?;
                let spell_id = self.spell_symbols.get(spell_name)
                    .copied()
                    .ok_or(format!("Unknown spell: {}", spell_name))?;

                Ok(JitEntry { condition: JitCondition::True, spell_id })
            }
            _ => Err(format!("Unknown keyword: {}", keyword)),
        }
    }

    fn compile_condition(&self, expr: &SExpr) -> Result<JitCondition, String> {
        match expr {
            SExpr::Atom(s) if s == "true" => Ok(JitCondition::True),

            SExpr::List(items) => {
                let op = items[0].as_atom().ok_or("Expected operator")?;

                match op {
                    "cooldown-ready" => {
                        let spell = items[1].as_atom().ok_or("Expected spell")?;
                        let id = self.spell_symbols.get(spell)
                            .copied()
                            .ok_or(format!("Unknown spell: {}", spell))?;
                        Ok(JitCondition::CooldownReady(id))
                    }
                    "charges-ge" => {
                        let spell = items[1].as_atom().ok_or("Expected spell")?;
                        let id = self.spell_symbols.get(spell)
                            .copied()
                            .ok_or(format!("Unknown spell: {}", spell))?;
                        let count = items[2].as_integer().ok_or("Expected integer")?;
                        Ok(JitCondition::ChargesGe(id, count))
                    }
                    "focus-ge" => {
                        let amount = items[1].as_number().ok_or("Expected number")?;
                        Ok(JitCondition::FocusGe(amount))
                    }
                    "aura-active" => {
                        let aura = items[1].as_atom().ok_or("Expected aura")?;
                        let id = self.aura_symbols.get(aura)
                            .copied()
                            .ok_or(format!("Unknown aura: {}", aura))?;
                        Ok(JitCondition::AuraActive(id))
                    }
                    "aura-remaining-le" => {
                        let aura = items[1].as_atom().ok_or("Expected aura")?;
                        let id = self.aura_symbols.get(aura)
                            .copied()
                            .ok_or(format!("Unknown aura: {}", aura))?;
                        let secs = items[2].as_number().ok_or("Expected number")?;
                        Ok(JitCondition::AuraRemainingLe(id, secs))
                    }
                    "target-health-lt" => {
                        let pct = items[1].as_number().ok_or("Expected number")?;
                        Ok(JitCondition::TargetHealthLt(pct))
                    }
                    "and" => {
                        let left = self.compile_condition(&items[1])?;
                        let right = self.compile_condition(&items[2])?;
                        Ok(JitCondition::And(Box::new(left), Box::new(right)))
                    }
                    "or" => {
                        let left = self.compile_condition(&items[1])?;
                        let right = self.compile_condition(&items[2])?;
                        Ok(JitCondition::Or(Box::new(left), Box::new(right)))
                    }
                    "not" => {
                        let inner = self.compile_condition(&items[1])?;
                        Ok(JitCondition::Not(Box::new(inner)))
                    }
                    _ => Err(format!("Unknown operator: {}", op)),
                }
            }
            _ => Err("Invalid condition".to_string()),
        }
    }
}
```

### Usage Example

```rust
fn main() {
    let mut compiler = RotationCompiler::new();

    // Register symbols
    compiler.add_spell("bestial_wrath", 0);
    compiler.add_spell("kill_command", 1);
    compiler.add_spell("barbed_shot", 2);
    compiler.add_spell("cobra_shot", 3);
    compiler.add_spell("wait_gcd", 255);
    compiler.add_aura("frenzy", 0);
    compiler.add_aura("bestial_wrath", 1);

    let source = r#"
        (rotation bm_hunter_st
          (action bestial_wrath
            (cooldown-ready bestial_wrath))
          (action kill_command
            (and (cooldown-ready kill_command)
                 (focus-ge 30)))
          (action barbed_shot
            (and (charges-ge barbed_shot 1)
                 (or (aura-remaining-le frenzy 2.0)
                     (not (aura-active frenzy)))))
          (fallback wait_gcd))
    "#;

    let entries = compiler.compile(source).unwrap();

    for entry in &entries {
        println!("{:?}", entry);
    }
}
```

---

## Pros and Cons

### Advantages

| Aspect | Benefit |
|--------|---------|
| **Parsing simplicity** | S-expression parser is ~100 lines, no ambiguity |
| **Direct IR mapping** | 1:1 correspondence with `JitCondition` variants |
| **Composability** | Conditions naturally nest without precedence rules |
| **Homoiconicity** | Code is data - easy to manipulate/transform |
| **Tooling** | Easy to write formatters, optimizers, analyzers |
| **No reserved words** | New operators added without grammar changes |
| **Consistent syntax** | Same structure for all constructs |
| **Whitespace insensitive** | Format however you like |

### Disadvantages

| Aspect | Drawback |
|--------|----------|
| **Unfamiliar syntax** | Most WoW players don't know Lisp |
| **Parentheses** | Can be visually noisy for long expressions |
| **No infix operators** | `(and a b)` instead of `a && b` |
| **Prefix notation** | `(focus-ge 30)` instead of `focus >= 30` |
| **Learning curve** | Requires getting used to prefix style |

### Mitigations for Drawbacks

1. **Syntax highlighting**: Good editor support makes parentheses manageable
2. **Formatting tools**: Auto-indentation makes structure clear
3. **Alternative frontend**: Could have infix syntax that compiles to S-expr IR
4. **Documentation**: Clear examples and tutorials

---

## Comparison with Other Syntaxes

### vs. Infix Syntax (like SimC APL)

```
; SimC-style infix:
/bestial_wrath,if=cooldown.ready
/kill_command,if=cooldown.ready&focus>=30
/barbed_shot,if=charges>=1&(aura.frenzy.remains<=2|!aura.frenzy.active)

; S-expression equivalent:
(action bestial_wrath (cooldown-ready bestial_wrath))
(action kill_command (and (cooldown-ready kill_command) (focus-ge 30)))
(action barbed_shot (and (charges-ge barbed_shot 1)
                         (or (aura-remaining-le frenzy 2.0)
                             (not (aura-active frenzy)))))
```

**Comparison**:
- Infix is more familiar but needs precedence rules
- S-expr is longer but unambiguous
- S-expr parser is 10x simpler

### vs. YAML/TOML DSL

```yaml
# YAML style:
rotation:
  name: bm_hunter_st
  actions:
    - spell: bestial_wrath
      condition:
        type: cooldown_ready
        spell: bestial_wrath
    - spell: kill_command
      condition:
        type: and
        conditions:
          - type: cooldown_ready
            spell: kill_command
          - type: focus_ge
            value: 30
```

**Comparison**:
- YAML is more verbose
- YAML needs special handling for nested conditions
- S-expr nesting is natural, YAML nesting is awkward

### vs. Rust Macro DSL

```rust
// Rust macro style:
rotation! {
    name: bm_hunter_st;

    if cooldown(bestial_wrath).ready {
        cast(bestial_wrath)
    }

    if cooldown(kill_command).ready && focus >= 30 {
        cast(kill_command)
    }
}
```

**Comparison**:
- Rust macros need compilation
- S-expr can be loaded at runtime
- Rust macros have better IDE support
- S-expr is more portable

### Performance Characteristics

| Syntax | Parse Time | Compile Time | Runtime |
|--------|------------|--------------|---------|
| S-expr | ~1us | ~5us | Native (JIT) |
| YAML | ~50us | ~10us | Native (JIT) |
| Infix | ~10us | ~5us | Native (JIT) |
| Rust macro | ~0 (compile) | ~0 (compile) | Native |

S-expressions have the fastest parse time due to their trivial grammar.

---

## Extended Syntax Ideas

### N-ary And/Or

For convenience, support variadic `and`/`or`:

```lisp
; Variadic and (desugars to nested binary and)
(and cond1 cond2 cond3 cond4)

; Equivalent to:
(and cond1 (and cond2 (and cond3 cond4)))
```

### Let Bindings

For reusable conditions:

```lisp
(rotation bm_hunter_st
  ; Define reusable conditions
  (let frenzy_refresh
    (or (aura-remaining-le frenzy 2.0)
        (not (aura-active frenzy))))

  (let has_focus
    (focus-ge 30))

  ; Use in actions
  (action barbed_shot
    (and (charges-ge barbed_shot 1)
         frenzy_refresh))

  (action kill_command
    (and (cooldown-ready kill_command)
         has_focus)))
```

### Action Lists (Sub-rotations)

```lisp
(rotation bm_hunter_st
  ; Define sub-rotation
  (deflist cooldowns
    (action call_of_the_wild (cooldown-ready call_of_the_wild))
    (action bestial_wrath (cooldown-ready bestial_wrath)))

  ; Call sub-rotation
  (call cooldowns)

  ; Continue with main rotation
  (action kill_command
    (and (cooldown-ready kill_command) (focus-ge 30))))
```

---

## Conclusion

S-expression syntax offers significant advantages for defining rotation logic that compiles to `JitCondition`:

1. **Perfect structural mapping** - The syntax mirrors the target IR exactly
2. **Trivial parser** - ~100 lines of Rust, no parser generator needed
3. **Maximum composability** - Conditions nest naturally
4. **Tooling friendly** - Easy to write analyzers, formatters, optimizers

The main tradeoff is unfamiliar syntax for users not exposed to Lisp-family languages. However, for a JIT IR that will likely be generated programmatically (from a UI or higher-level DSL), S-expressions are an ideal internal representation.

**Recommended use case**: Use S-expressions as the **intermediate representation** or **serialization format** for rotation logic, with optional higher-level syntaxes that compile down to S-expr before JIT compilation.

---

## References

- [Structure and Interpretation of Computer Programs](https://mitpress.mit.edu/sites/default/files/sicp/index.html)
- [Lisp - Wikipedia](https://en.wikipedia.org/wiki/Lisp_(programming_language))
- [S-expression - Wikipedia](https://en.wikipedia.org/wiki/S-expression)
- [The Power of S-expressions](https://stopa.io/post/265)
- [Why Lisp Macros are Cool](https://www.defmacro.org/ramblings/lisp.html)
