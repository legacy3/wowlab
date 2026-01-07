# YAML/Indentation-Based DSL for Rotation Scripting

A concrete DSL design using YAML or Python-like indentation-based syntax that compiles directly to the JIT rotation system.

## Target Rust Structure

The DSL compiles to these structures:

```rust
pub enum JitCondition {
    CooldownReady(u8),           // Spell slot is off cooldown
    ChargesGe(u8, u8),           // Spell slot has >= N charges
    FocusGe(f32),                // Focus >= threshold
    AuraActive(u8),              // Aura slot is active
    AuraRemainingLe(u8, f32),    // Aura remaining <= seconds
    TargetHealthLt(f32),         // Target health < percent
    And(Box<JitCondition>, Box<JitCondition>),
    Or(Box<JitCondition>, Box<JitCondition>),
    Not(Box<JitCondition>),
    True,                        // Always true (unconditional)
}

pub struct JitEntry {
    pub condition: JitCondition,
    pub spell_id: u8,            // Spell slot to cast
}
```

---

## Syntax Specification

### Option A: YAML-Based Syntax

```yaml
rotation:
  name: bm_hunter_st
  version: 1
  spec: beast_mastery

  # Spell slot mappings (name -> u8 slot)
  spells:
    bestial_wrath: 0
    kill_command: 1
    barbed_shot: 2
    cobra_shot: 3
    call_of_the_wild: 4
    bloodshed: 5
    kill_shot: 6
    dire_beast: 7
    multi_shot: 8

  # Aura slot mappings (name -> u8 slot)
  auras:
    bestial_wrath: 0
    frenzy: 1
    beast_cleave: 2
    call_of_the_wild: 3

  # Priority list (evaluated top-to-bottom)
  actions:
    - spell: call_of_the_wild
      if: cooldown.ready

    - spell: bestial_wrath
      if: cooldown.ready

    - spell: bloodshed
      if: cooldown.ready

    - spell: kill_command
      if:
        all:
          - cooldown.ready
          - focus >= 30

    - spell: barbed_shot
      if:
        any:
          - charges >= 2
          - aura.frenzy.remaining <= 1.5

    - spell: dire_beast
      if: cooldown.ready

    - spell: kill_shot
      if:
        all:
          - cooldown.ready
          - target.health < 0.20
          - focus >= 10

    - spell: cobra_shot
      if: focus >= 50

    # Default filler
    - spell: cobra_shot
      if: focus >= 35
```

### Option B: Python-Like Indentation Syntax

```python
rotation bm_hunter_st:
    spec: beast_mastery

    spells:
        bestial_wrath = 0
        kill_command = 1
        barbed_shot = 2
        cobra_shot = 3
        call_of_the_wild = 4
        bloodshed = 5
        kill_shot = 6
        dire_beast = 7

    auras:
        bestial_wrath = 0
        frenzy = 1
        beast_cleave = 2

    priority:
        # Major cooldowns
        if cooldown.call_of_the_wild.ready:
            cast call_of_the_wild

        if cooldown.bestial_wrath.ready:
            cast bestial_wrath

        if cooldown.bloodshed.ready:
            cast bloodshed

        # Core rotation
        if cooldown.kill_command.ready and focus >= 30:
            cast kill_command

        if charges.barbed_shot >= 2 or aura.frenzy.remaining <= 1.5:
            cast barbed_shot

        if cooldown.dire_beast.ready:
            cast dire_beast

        # Execute
        if cooldown.kill_shot.ready and target.health < 0.20 and focus >= 10:
            cast kill_shot

        # Filler
        if focus >= 50:
            cast cobra_shot

        # Low priority filler
        if focus >= 35:
            cast cobra_shot
```

---

## Complete BM Hunter Rotation Example (YAML)

```yaml
rotation:
  name: bm_hunter_st
  version: 1
  spec: beast_mastery
  description: "BM Hunter single target priority"

  spells:
    # Core abilities
    kill_command: 1
    cobra_shot: 2
    barbed_shot: 3
    bestial_wrath: 4
    multi_shot: 5
    kill_shot: 6
    # Major cooldowns
    call_of_the_wild: 10
    bloodshed: 11
    dire_beast: 12
    murder_of_crows: 13
    # Hero talents
    black_arrow: 20
    howl_of_the_pack: 21

  auras:
    bestial_wrath: 0
    frenzy: 1
    beast_cleave: 2
    call_of_the_wild: 3
    thrill_of_the_hunt: 4
    serpentine_rhythm: 5
    bloodshed: 6

  actions:
    # ========================================
    # OPENER / MAJOR COOLDOWNS
    # ========================================

    - spell: call_of_the_wild
      if: cooldown.ready
      comment: "Major CD - use on pull"

    - spell: bestial_wrath
      if: cooldown.ready
      comment: "Primary damage CD"

    - spell: bloodshed
      if: cooldown.ready
      comment: "Burst window amplifier"

    # ========================================
    # PET FRENZY MAINTENANCE
    # ========================================

    - spell: barbed_shot
      if:
        any:
          - aura.frenzy.remaining <= 1.5
          - not: aura.frenzy.active
      comment: "Maintain Frenzy before it falls off"

    # ========================================
    # CORE ROTATION
    # ========================================

    - spell: kill_command
      if:
        all:
          - cooldown.ready
          - focus >= 30
      comment: "Primary damage ability"

    - spell: barbed_shot
      if: charges >= 2
      comment: "Dump charges to avoid overcapping"

    - spell: dire_beast
      if: cooldown.ready
      comment: "On CD for extra damage + focus"

    # ========================================
    # EXECUTE PHASE
    # ========================================

    - spell: kill_shot
      if:
        all:
          - cooldown.ready
          - target.health < 0.20
          - focus >= 10
      comment: "Execute range ability"

    # ========================================
    # FILLERS
    # ========================================

    - spell: cobra_shot
      if: focus >= 50
      comment: "High focus dump"

    - spell: barbed_shot
      if: charges >= 1
      comment: "Use charges before hard-casting Cobra"

    - spell: cobra_shot
      if: focus >= 35
      comment: "Standard filler"
```

---

## Complete MM Hunter Rotation Example (YAML)

```yaml
rotation:
  name: mm_hunter_st
  version: 1
  spec: marksmanship
  description: "MM Hunter single target priority"

  spells:
    aimed_shot: 1
    rapid_fire: 2
    steady_shot: 3
    arcane_shot: 4
    kill_shot: 5
    trueshot: 10
    multi_shot: 6
    volley: 7

  auras:
    trueshot: 0
    precise_shots: 1
    steady_focus: 2
    lock_and_load: 3
    trick_shots: 4
    lone_wolf: 5

  actions:
    # ========================================
    # MAJOR COOLDOWN
    # ========================================

    - spell: trueshot
      if: cooldown.ready
      comment: "Major CD - big haste + crit window"

    # ========================================
    # LOCK AND LOAD PROCS
    # ========================================

    - spell: aimed_shot
      if:
        all:
          - aura.lock_and_load.active
          - focus >= 15
      comment: "Instant Aimed Shot from proc"

    # ========================================
    # CORE ROTATION
    # ========================================

    - spell: aimed_shot
      if:
        all:
          - cooldown.ready
          - focus >= 35
      comment: "Primary damage + generates Precise Shots"

    - spell: rapid_fire
      if: cooldown.ready
      comment: "High damage channel"

    # ========================================
    # PRECISE SHOTS CONSUMPTION
    # ========================================

    - spell: arcane_shot
      if:
        all:
          - aura.precise_shots.active
          - focus >= 20
      comment: "Consume Precise Shots buff"

    # ========================================
    # EXECUTE PHASE
    # ========================================

    - spell: kill_shot
      if:
        all:
          - cooldown.ready
          - target.health < 0.20
          - focus >= 10
      comment: "Execute range"

    # ========================================
    # STEADY FOCUS MAINTENANCE
    # ========================================

    - spell: steady_shot
      if:
        all:
          - aura.steady_focus.remaining <= 5.0
          - focus < 80
      comment: "Maintain Steady Focus buff"

    # ========================================
    # FILLERS
    # ========================================

    - spell: arcane_shot
      if: focus >= 60
      comment: "Dump excess focus"

    - spell: steady_shot
      if: true
      comment: "Focus generator - default action"
```

---

## Complete MM Hunter Rotation Example (Python-style)

```python
rotation mm_hunter_st:
    spec: marksmanship

    spells:
        aimed_shot = 1
        rapid_fire = 2
        steady_shot = 3
        arcane_shot = 4
        kill_shot = 5
        trueshot = 10
        multi_shot = 6

    auras:
        trueshot = 0
        precise_shots = 1
        steady_focus = 2
        lock_and_load = 3

    priority:
        # Major CD
        if cooldown.trueshot.ready:
            cast trueshot

        # Lock and Load instant Aimed Shot
        if aura.lock_and_load.active and focus >= 15:
            cast aimed_shot

        # Primary damage
        if cooldown.aimed_shot.ready and focus >= 35:
            cast aimed_shot

        # Channel damage
        if cooldown.rapid_fire.ready:
            cast rapid_fire

        # Consume Precise Shots
        if aura.precise_shots.active and focus >= 20:
            cast arcane_shot

        # Execute
        if cooldown.kill_shot.ready and target.health < 0.20 and focus >= 10:
            cast kill_shot

        # Maintain Steady Focus
        if aura.steady_focus.remaining <= 5.0 and focus < 80:
            cast steady_shot

        # Dump focus
        if focus >= 60:
            cast arcane_shot

        # Default generator
        cast steady_shot
```

---

## Condition Mapping to JitCondition

### YAML Condition Syntax

| YAML Syntax | JitCondition Variant |
|-------------|---------------------|
| `cooldown.ready` | `CooldownReady(spell_slot)` |
| `charges >= N` | `ChargesGe(spell_slot, N)` |
| `focus >= N` | `FocusGe(N)` |
| `aura.X.active` | `AuraActive(aura_slot)` |
| `aura.X.remaining <= N` | `AuraRemainingLe(aura_slot, N)` |
| `target.health < N` | `TargetHealthLt(N)` |
| `all: [...]` | `And(...)` (nested) |
| `any: [...]` | `Or(...)` (nested) |
| `not: ...` | `Not(...)` |
| `true` | `True` |

### Python-style Condition Syntax

| Python Syntax | JitCondition Variant |
|--------------|---------------------|
| `cooldown.X.ready` | `CooldownReady(spell_slot)` |
| `charges.X >= N` | `ChargesGe(spell_slot, N)` |
| `focus >= N` | `FocusGe(N)` |
| `aura.X.active` | `AuraActive(aura_slot)` |
| `aura.X.remaining <= N` | `AuraRemainingLe(aura_slot, N)` |
| `target.health < N` | `TargetHealthLt(N)` |
| `A and B` | `And(A, B)` |
| `A or B` | `Or(A, B)` |
| `not A` | `Not(A)` |
| (implicit true) | `True` |

### Compilation Examples

**YAML:**
```yaml
- spell: kill_command
  if:
    all:
      - cooldown.ready
      - focus >= 30
```

**Compiles to:**
```rust
JitEntry {
    condition: JitCondition::And(
        Box::new(JitCondition::CooldownReady(1)),  // kill_command slot
        Box::new(JitCondition::FocusGe(30.0)),
    ),
    spell_id: 1,
}
```

**YAML:**
```yaml
- spell: barbed_shot
  if:
    any:
      - charges >= 2
      - aura.frenzy.remaining <= 1.5
```

**Compiles to:**
```rust
JitEntry {
    condition: JitCondition::Or(
        Box::new(JitCondition::ChargesGe(3, 2)),   // barbed_shot slot, 2 charges
        Box::new(JitCondition::AuraRemainingLe(1, 1.5)),  // frenzy aura slot
    ),
    spell_id: 3,
}
```

---

## Parser Implementation Sketch

### Lexer (Python-style syntax)

```rust
#[derive(Debug, Clone, PartialEq)]
pub enum Token {
    // Keywords
    Rotation,
    Spec,
    Spells,
    Auras,
    Priority,
    If,
    Cast,
    And,
    Or,
    Not,
    True,

    // Identifiers and literals
    Ident(String),
    Number(f32),

    // Operators
    Eq,           // =
    Ge,           // >=
    Le,           // <=
    Lt,           // <
    Gt,           // >
    Colon,        // :
    Dot,          // .

    // Structure
    Indent,
    Dedent,
    Newline,
    Eof,
}

pub struct Lexer<'a> {
    input: &'a str,
    pos: usize,
    indent_stack: Vec<usize>,
}

impl<'a> Lexer<'a> {
    pub fn tokenize(&mut self) -> Vec<Token> {
        let mut tokens = Vec::new();

        while !self.at_end() {
            // Handle indentation at start of line
            if self.at_line_start() {
                let indent = self.count_indent();
                let current = *self.indent_stack.last().unwrap_or(&0);

                if indent > current {
                    self.indent_stack.push(indent);
                    tokens.push(Token::Indent);
                } else {
                    while let Some(&top) = self.indent_stack.last() {
                        if indent < top {
                            self.indent_stack.pop();
                            tokens.push(Token::Dedent);
                        } else {
                            break;
                        }
                    }
                }
            }

            // Skip whitespace within line
            self.skip_whitespace();

            // Handle comments
            if self.peek() == Some('#') {
                self.skip_to_eol();
                continue;
            }

            // Tokenize
            match self.peek() {
                Some('\n') => {
                    self.advance();
                    tokens.push(Token::Newline);
                }
                Some(':') => {
                    self.advance();
                    tokens.push(Token::Colon);
                }
                Some('.') => {
                    self.advance();
                    tokens.push(Token::Dot);
                }
                Some('=') => {
                    self.advance();
                    tokens.push(Token::Eq);
                }
                Some('>') => {
                    self.advance();
                    if self.peek() == Some('=') {
                        self.advance();
                        tokens.push(Token::Ge);
                    } else {
                        tokens.push(Token::Gt);
                    }
                }
                Some('<') => {
                    self.advance();
                    if self.peek() == Some('=') {
                        self.advance();
                        tokens.push(Token::Le);
                    } else {
                        tokens.push(Token::Lt);
                    }
                }
                Some(c) if c.is_ascii_digit() => {
                    tokens.push(self.number());
                }
                Some(c) if c.is_ascii_alphabetic() || c == '_' => {
                    tokens.push(self.identifier());
                }
                None => break,
                _ => self.advance(), // Skip unknown
            }
        }

        // Emit remaining dedents
        while self.indent_stack.len() > 1 {
            self.indent_stack.pop();
            tokens.push(Token::Dedent);
        }

        tokens.push(Token::Eof);
        tokens
    }

    fn identifier(&mut self) -> Token {
        let start = self.pos;
        while let Some(c) = self.peek() {
            if c.is_ascii_alphanumeric() || c == '_' {
                self.advance();
            } else {
                break;
            }
        }
        let text = &self.input[start..self.pos];
        match text {
            "rotation" => Token::Rotation,
            "spec" => Token::Spec,
            "spells" => Token::Spells,
            "auras" => Token::Auras,
            "priority" => Token::Priority,
            "if" => Token::If,
            "cast" => Token::Cast,
            "and" => Token::And,
            "or" => Token::Or,
            "not" => Token::Not,
            "true" => Token::True,
            _ => Token::Ident(text.to_string()),
        }
    }

    fn number(&mut self) -> Token {
        let start = self.pos;
        while let Some(c) = self.peek() {
            if c.is_ascii_digit() || c == '.' {
                self.advance();
            } else {
                break;
            }
        }
        let text = &self.input[start..self.pos];
        Token::Number(text.parse().unwrap_or(0.0))
    }

    // ... helper methods
}
```

### Parser

```rust
pub struct Parser {
    tokens: Vec<Token>,
    pos: usize,
    spell_slots: HashMap<String, u8>,
    aura_slots: HashMap<String, u8>,
}

#[derive(Debug)]
pub struct RotationAst {
    pub name: String,
    pub spec: String,
    pub entries: Vec<ActionEntry>,
}

#[derive(Debug)]
pub struct ActionEntry {
    pub spell_name: String,
    pub condition: ConditionAst,
}

#[derive(Debug)]
pub enum ConditionAst {
    CooldownReady(String),
    ChargesGe(String, u8),
    FocusGe(f32),
    AuraActive(String),
    AuraRemainingLe(String, f32),
    TargetHealthLt(f32),
    And(Box<ConditionAst>, Box<ConditionAst>),
    Or(Box<ConditionAst>, Box<ConditionAst>),
    Not(Box<ConditionAst>),
    True,
}

impl Parser {
    pub fn parse(&mut self) -> Result<RotationAst, ParseError> {
        // Parse: rotation NAME:
        self.expect(Token::Rotation)?;
        let name = self.expect_ident()?;
        self.expect(Token::Colon)?;
        self.expect(Token::Newline)?;
        self.expect(Token::Indent)?;

        // Parse spec declaration
        self.expect_keyword("spec")?;
        self.expect(Token::Colon)?;
        let spec = self.expect_ident()?;
        self.expect(Token::Newline)?;

        // Parse spells block
        if self.check_keyword("spells") {
            self.parse_spells_block()?;
        }

        // Parse auras block
        if self.check_keyword("auras") {
            self.parse_auras_block()?;
        }

        // Parse priority block
        self.expect_keyword("priority")?;
        self.expect(Token::Colon)?;
        self.expect(Token::Newline)?;
        self.expect(Token::Indent)?;

        let entries = self.parse_priority_list()?;

        Ok(RotationAst { name, spec, entries })
    }

    fn parse_priority_list(&mut self) -> Result<Vec<ActionEntry>, ParseError> {
        let mut entries = Vec::new();

        while !self.check(Token::Dedent) && !self.check(Token::Eof) {
            if self.check(Token::If) {
                // Conditional action
                self.advance(); // consume 'if'
                let condition = self.parse_condition()?;
                self.expect(Token::Colon)?;
                self.expect(Token::Newline)?;
                self.expect(Token::Indent)?;
                self.expect(Token::Cast)?;
                let spell_name = self.expect_ident()?;
                self.expect(Token::Newline)?;
                self.expect(Token::Dedent)?;

                entries.push(ActionEntry {
                    spell_name,
                    condition,
                });
            } else if self.check(Token::Cast) {
                // Unconditional action
                self.advance(); // consume 'cast'
                let spell_name = self.expect_ident()?;
                self.expect(Token::Newline)?;

                entries.push(ActionEntry {
                    spell_name,
                    condition: ConditionAst::True,
                });
            } else {
                // Skip comments/empty lines
                self.skip_to_next_statement();
            }
        }

        Ok(entries)
    }

    fn parse_condition(&mut self) -> Result<ConditionAst, ParseError> {
        self.parse_or_expr()
    }

    fn parse_or_expr(&mut self) -> Result<ConditionAst, ParseError> {
        let mut left = self.parse_and_expr()?;

        while self.check(Token::Or) {
            self.advance();
            let right = self.parse_and_expr()?;
            left = ConditionAst::Or(Box::new(left), Box::new(right));
        }

        Ok(left)
    }

    fn parse_and_expr(&mut self) -> Result<ConditionAst, ParseError> {
        let mut left = self.parse_unary_expr()?;

        while self.check(Token::And) {
            self.advance();
            let right = self.parse_unary_expr()?;
            left = ConditionAst::And(Box::new(left), Box::new(right));
        }

        Ok(left)
    }

    fn parse_unary_expr(&mut self) -> Result<ConditionAst, ParseError> {
        if self.check(Token::Not) {
            self.advance();
            let inner = self.parse_unary_expr()?;
            return Ok(ConditionAst::Not(Box::new(inner)));
        }

        self.parse_primary_expr()
    }

    fn parse_primary_expr(&mut self) -> Result<ConditionAst, ParseError> {
        // Handle: cooldown.X.ready
        if self.check_keyword("cooldown") {
            self.advance();
            self.expect(Token::Dot)?;
            let spell_name = self.expect_ident()?;
            self.expect(Token::Dot)?;
            self.expect_keyword("ready")?;
            return Ok(ConditionAst::CooldownReady(spell_name));
        }

        // Handle: charges.X >= N
        if self.check_keyword("charges") {
            self.advance();
            self.expect(Token::Dot)?;
            let spell_name = self.expect_ident()?;
            self.expect(Token::Ge)?;
            let count = self.expect_number()? as u8;
            return Ok(ConditionAst::ChargesGe(spell_name, count));
        }

        // Handle: focus >= N
        if self.check_keyword("focus") {
            self.advance();
            self.expect(Token::Ge)?;
            let threshold = self.expect_number()?;
            return Ok(ConditionAst::FocusGe(threshold));
        }

        // Handle: aura.X.active or aura.X.remaining <= N
        if self.check_keyword("aura") {
            self.advance();
            self.expect(Token::Dot)?;
            let aura_name = self.expect_ident()?;
            self.expect(Token::Dot)?;

            if self.check_keyword("active") {
                self.advance();
                return Ok(ConditionAst::AuraActive(aura_name));
            } else if self.check_keyword("remaining") {
                self.advance();
                self.expect(Token::Le)?;
                let duration = self.expect_number()?;
                return Ok(ConditionAst::AuraRemainingLe(aura_name, duration));
            }
        }

        // Handle: target.health < N
        if self.check_keyword("target") {
            self.advance();
            self.expect(Token::Dot)?;
            self.expect_keyword("health")?;
            self.expect(Token::Lt)?;
            let threshold = self.expect_number()?;
            return Ok(ConditionAst::TargetHealthLt(threshold));
        }

        Err(ParseError::UnexpectedToken)
    }

    // ... helper methods
}
```

### Code Generator

```rust
pub struct CodeGenerator {
    spell_slots: HashMap<String, u8>,
    aura_slots: HashMap<String, u8>,
}

impl CodeGenerator {
    pub fn generate(&self, ast: &RotationAst) -> Vec<JitEntry> {
        ast.entries
            .iter()
            .filter_map(|entry| self.generate_entry(entry))
            .collect()
    }

    fn generate_entry(&self, entry: &ActionEntry) -> Option<JitEntry> {
        let spell_id = *self.spell_slots.get(&entry.spell_name)?;
        let condition = self.generate_condition(&entry.condition)?;

        Some(JitEntry {
            condition,
            spell_id,
        })
    }

    fn generate_condition(&self, cond: &ConditionAst) -> Option<JitCondition> {
        match cond {
            ConditionAst::CooldownReady(spell) => {
                let slot = *self.spell_slots.get(spell)?;
                Some(JitCondition::CooldownReady(slot))
            }

            ConditionAst::ChargesGe(spell, count) => {
                let slot = *self.spell_slots.get(spell)?;
                Some(JitCondition::ChargesGe(slot, *count))
            }

            ConditionAst::FocusGe(threshold) => {
                Some(JitCondition::FocusGe(*threshold))
            }

            ConditionAst::AuraActive(aura) => {
                let slot = *self.aura_slots.get(aura)?;
                Some(JitCondition::AuraActive(slot))
            }

            ConditionAst::AuraRemainingLe(aura, duration) => {
                let slot = *self.aura_slots.get(aura)?;
                Some(JitCondition::AuraRemainingLe(slot, *duration))
            }

            ConditionAst::TargetHealthLt(threshold) => {
                Some(JitCondition::TargetHealthLt(*threshold))
            }

            ConditionAst::And(left, right) => {
                let l = self.generate_condition(left)?;
                let r = self.generate_condition(right)?;
                Some(JitCondition::And(Box::new(l), Box::new(r)))
            }

            ConditionAst::Or(left, right) => {
                let l = self.generate_condition(left)?;
                let r = self.generate_condition(right)?;
                Some(JitCondition::Or(Box::new(l), Box::new(r)))
            }

            ConditionAst::Not(inner) => {
                let i = self.generate_condition(inner)?;
                Some(JitCondition::Not(Box::new(i)))
            }

            ConditionAst::True => {
                Some(JitCondition::True)
            }
        }
    }
}
```

### YAML Parser (using serde)

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct YamlRotation {
    pub rotation: RotationDef,
}

#[derive(Debug, Deserialize)]
pub struct RotationDef {
    pub name: String,
    pub version: Option<u32>,
    pub spec: String,
    pub description: Option<String>,
    pub spells: HashMap<String, u8>,
    pub auras: HashMap<String, u8>,
    pub actions: Vec<YamlAction>,
}

#[derive(Debug, Deserialize)]
pub struct YamlAction {
    pub spell: String,
    #[serde(rename = "if")]
    pub condition: Option<YamlCondition>,
    pub comment: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(untagged)]
pub enum YamlCondition {
    Simple(String),
    Complex(ComplexCondition),
}

#[derive(Debug, Deserialize)]
pub struct ComplexCondition {
    pub all: Option<Vec<YamlCondition>>,
    pub any: Option<Vec<YamlCondition>>,
    pub not: Option<Box<YamlCondition>>,
}

impl YamlCondition {
    pub fn to_jit(&self, spells: &HashMap<String, u8>, auras: &HashMap<String, u8>) -> JitCondition {
        match self {
            YamlCondition::Simple(s) => parse_simple_condition(s, spells, auras),
            YamlCondition::Complex(c) => {
                if let Some(ref all) = c.all {
                    let mut iter = all.iter().map(|c| c.to_jit(spells, auras));
                    let first = iter.next().unwrap_or(JitCondition::True);
                    iter.fold(first, |acc, cond| {
                        JitCondition::And(Box::new(acc), Box::new(cond))
                    })
                } else if let Some(ref any) = c.any {
                    let mut iter = any.iter().map(|c| c.to_jit(spells, auras));
                    let first = iter.next().unwrap_or(JitCondition::True);
                    iter.fold(first, |acc, cond| {
                        JitCondition::Or(Box::new(acc), Box::new(cond))
                    })
                } else if let Some(ref not) = c.not {
                    JitCondition::Not(Box::new(not.to_jit(spells, auras)))
                } else {
                    JitCondition::True
                }
            }
        }
    }
}

fn parse_simple_condition(
    s: &str,
    spells: &HashMap<String, u8>,
    auras: &HashMap<String, u8>,
) -> JitCondition {
    // Parse: "cooldown.ready" (spell context from action)
    if s == "cooldown.ready" {
        // Note: spell slot resolved at action level
        return JitCondition::True; // Placeholder
    }

    // Parse: "charges >= N"
    if let Some(rest) = s.strip_prefix("charges >= ") {
        if let Ok(n) = rest.parse::<u8>() {
            // Spell slot resolved at action level
            return JitCondition::ChargesGe(0, n); // Placeholder slot
        }
    }

    // Parse: "focus >= N"
    if let Some(rest) = s.strip_prefix("focus >= ") {
        if let Ok(n) = rest.parse::<f32>() {
            return JitCondition::FocusGe(n);
        }
    }

    // Parse: "aura.X.active"
    if s.starts_with("aura.") && s.ends_with(".active") {
        let aura_name = &s[5..s.len() - 7];
        if let Some(&slot) = auras.get(aura_name) {
            return JitCondition::AuraActive(slot);
        }
    }

    // Parse: "aura.X.remaining <= N"
    if s.starts_with("aura.") && s.contains(".remaining <= ") {
        let parts: Vec<&str> = s.split(".remaining <= ").collect();
        if parts.len() == 2 {
            let aura_name = &parts[0][5..];
            if let (Some(&slot), Ok(duration)) = (auras.get(aura_name), parts[1].parse::<f32>()) {
                return JitCondition::AuraRemainingLe(slot, duration);
            }
        }
    }

    // Parse: "target.health < N"
    if let Some(rest) = s.strip_prefix("target.health < ") {
        if let Ok(n) = rest.parse::<f32>() {
            return JitCondition::TargetHealthLt(n);
        }
    }

    // Parse: "true"
    if s == "true" {
        return JitCondition::True;
    }

    // Default
    JitCondition::True
}
```

---

## Pros and Cons

### YAML Syntax

**Pros:**
- Widely known format, familiar to most developers
- Excellent tooling support (syntax highlighting, validation, formatting)
- Structured data naturally maps to complex conditions
- Native support for comments
- Easy to generate programmatically
- Schema validation possible (JSON Schema)
- Works well with version control (readable diffs)

**Cons:**
- Verbose for simple conditions
- Nested `all:`/`any:` can become deeply indented
- YAML parsing quirks (string vs number ambiguity)
- Less intuitive for expressing boolean logic inline
- Requires external parser library (serde_yaml)

### Python-style Syntax

**Pros:**
- More natural expression of boolean logic (`and`, `or`, `not`)
- Compact representation of conditions
- Familiar to anyone who knows Python/SimC APL
- Direct mapping to traditional rotation syntax
- Easier to read for complex conditionals
- No quotes needed for identifiers

**Cons:**
- Requires custom lexer/parser (no off-the-shelf solution)
- Significant whitespace can cause subtle bugs
- More complex parser implementation
- Less tooling support initially
- Harder to generate programmatically

### Performance Comparison (vs Rhai)

| Aspect | YAML DSL | Python DSL | Rhai (current) |
|--------|----------|------------|----------------|
| Parse time | ~50us | ~100us | N/A (built-in) |
| Compile time | ~10us | ~15us | ~12us (optimize_partial) |
| Eval time | ~5-20ns | ~5-20ns | ~50ns-8us |
| Memory | ~200 bytes | ~200 bytes | ~50KB |
| Hot reload | File watch | File watch | Instant |

### Recommendation

**For this project: YAML syntax is recommended** because:

1. **Simpler implementation**: Use serde_yaml for parsing, no custom lexer needed
2. **Better tooling**: IDE support, validation, linting out of the box
3. **Structured conditions**: `all:`/`any:`/`not:` maps cleanly to JitCondition tree
4. **Documentation**: Comments inline with actions
5. **Interoperability**: Can be generated/consumed by external tools
6. **Maintenance**: Easier for non-Rust developers to modify rotations

The Python-style syntax could be added later as an alternative frontend that parses to the same AST, allowing users to choose their preferred format.

---

## File Organization

```
crates/engine/
  src/
    rotation/
      dsl/
        mod.rs           # Public API
        yaml.rs          # YAML parser
        python.rs        # Python-style parser (optional)
        codegen.rs       # AST -> JitEntry compiler
        ast.rs           # Shared AST types
        error.rs         # Parse/compile errors
      jit/
        mod.rs           # JIT runtime
        condition.rs     # JitCondition evaluation
        entry.rs         # JitEntry structures

data/
  rotations/
    hunter/
      bm_st.yaml         # BM single target
      bm_aoe.yaml        # BM AoE
      mm_st.yaml         # MM single target
      mm_aoe.yaml        # MM AoE
```

---

## Integration Example

```rust
use crate::rotation::dsl::{load_rotation, compile_rotation};
use crate::rotation::jit::{JitRotation, JitContext};

// Load and compile rotation
let yaml = std::fs::read_to_string("data/rotations/hunter/bm_st.yaml")?;
let ast = load_rotation(&yaml)?;
let entries = compile_rotation(&ast)?;
let rotation = JitRotation::new(entries);

// In simulation loop
impl SpecHandler for BmHunter {
    fn next_action(&self, ctx: &JitContext) -> Option<SpellIdx> {
        self.rotation.evaluate(ctx)
    }
}
```
