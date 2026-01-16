# Rotation API Design

## THE RULE

**The engine defines the API. Period.**

- The engine is the ONLY source of truth
- All naming conventions come from the engine
- All data structures come from the engine
- All validation comes from the engine
- Everything else (UI, database, tools) CONSUMES this API
- Nothing else DEFINES anything

If you're designing something and you think "maybe the UI needs..." - STOP. Design the engine API first. The UI adapts to the engine, not the other way around.

---

## DESIGN GOALS

### Human Readable

The API should be readable by humans. Someone should look at a rotation JSON and understand what it does without documentation.

**GOOD:**
```json
{
  "cast": "Kill Command",
  "when": "cooldown is ready and focus >= 30"
}
```

**BAD:**
```json
{
  "a": "kc",
  "c": { "&": [{ "cd": [0, "r"] }, { ">=": ["f", 30] }] }
}
```

### Not SimC

SimC syntax is optimized for typing speed, not readability:

```
actions+=/kill_command,if=cooldown.kill_command.ready&focus>=30
```

This is bad. Abbreviations everywhere. `+=` operator. Dot notation mixed with operators. We're not SimC. We don't want to be SimC.

### Query Builders Are Fine

Yes, the UI will probably use a query builder. That's fine. But the UNDERLYING API should still be clean. The query builder produces JSON that humans can read and edit directly if they want.

---

## Current Engine API

Location: `crates/engine/rotations/bm_hunter.json`

```json
{
  "name": "BM Hunter ST",
  "variables": {
    "in_opener": { "<": ["combat.time", 10] },
    "pool_for_bw": { "and": [
      { "<": ["cd.bestial_wrath.remaining", 3] },
      { "<": ["resource.focus", 70] }
    ]},
    "need_frenzy_refresh": { "and": [
      "buff.frenzy.active",
      { "<": ["buff.frenzy.remaining", 2] }
    ]}
  },
  "lists": {
    "cooldowns": [
      { "cast": "bestial_wrath", "if": "cd.bestial_wrath.ready" },
      { "cast": "call_of_the_wild", "if": { "and": [
        "cd.call_of_the_wild.ready",
        "buff.bestial_wrath.active"
      ]}}
    ],
    "st": [
      { "cast": "barbed_shot", "if": { "or": [
        { "not": "buff.frenzy.active" },
        "need_frenzy_refresh",
        { ">=": ["cd.barbed_shot.charges", 2] }
      ]}},
      { "cast": "kill_command", "if": "cd.kill_command.ready" },
      { "cast": "cobra_shot", "if": { ">=": ["resource.focus", 50] }}
    ]
  },
  "actions": [
    { "call": "cooldowns" },
    { "call": "st" }
  ]
}
```

Run it:
```bash
/Users/user/Source/wowlab/crates/target/release/engine sim -s bm-hunter -d 30 -i 10 --rotation /Users/user/Source/wowlab/crates/engine/rotations/bm_hunter.json
```

---

## Current API Structure

### Top Level
```json
{
  "name": "string",
  "variables": { "name": <expr>, ... },
  "lists": { "name": [<action>, ...], ... },
  "actions": [<action>, ...]
}
```

### Actions
```json
{ "cast": "spell_name", "if": <expr> }
{ "call": "list_name", "if": <expr> }
{ "run": "list_name", "if": <expr> }
{ "set": "var_name", "value": <expr>, "if": <expr> }
{ "modify": "var_name", "op": "add|sub|mul|div|min|max|set|reset", "value": <expr>, "if": <expr> }
{ "wait": <seconds>, "if": <expr> }
{ "wait_until": <expr> }
{ "pool": true, "extra": <amount>, "if": <expr> }
{ "use_trinket": <slot>, "if": <expr> }
{ "use_item": "item_name", "if": <expr> }
```

### Expressions (JSONLogic-style)
```json
// Literals
true, false, 42, 3.14

// Variable path (string)
"cd.kill_command.ready"
"buff.frenzy.active"
"resource.focus"

// User variable reference (string, resolved by context)
"my_variable"

// Comparison
{ "<": [<expr>, <expr>] }
{ "<=": [<expr>, <expr>] }
{ ">": [<expr>, <expr>] }
{ ">=": [<expr>, <expr>] }
{ "==": [<expr>, <expr>] }
{ "!=": [<expr>, <expr>] }

// Logical
{ "and": [<expr>, <expr>, ...] }
{ "or": [<expr>, <expr>, ...] }
{ "not": <expr> }

// Arithmetic
{ "+": [<expr>, <expr>] }
{ "-": [<expr>, <expr>] }
{ "*": [<expr>, <expr>] }
{ "/": [<expr>, <expr>] }
{ "%": [<expr>, <expr>] }

// Functions
{ "floor": <expr> }
{ "ceil": <expr> }
{ "abs": <expr> }
{ "min": [<expr>, <expr>] }
{ "max": [<expr>, <expr>] }
```

### Variable Paths

Defined in `crates/engine/src/rotation/parser.rs:329-421`

```
resource.<name>                -> float (current amount)
resource.<name>.max            -> float
resource.<name>.deficit        -> float
resource.<name>.percent        -> float
resource.<name>.regen          -> float

player.health                  -> float
player.health.max              -> float
player.health.percent          -> float

cd.<spell>.ready               -> bool
cd.<spell>.remaining           -> float
cd.<spell>.duration            -> float
cd.<spell>.charges             -> int
cd.<spell>.charges_max         -> int
cd.<spell>.recharge_time       -> float
cd.<spell>.full_recharge       -> float

buff.<aura>.active             -> bool
buff.<aura>.inactive           -> bool
buff.<aura>.remaining          -> float
buff.<aura>.stacks             -> int
buff.<aura>.stacks_max         -> int
buff.<aura>.duration           -> float

debuff.<aura>.active           -> bool
debuff.<aura>.inactive         -> bool
debuff.<aura>.remaining        -> float
debuff.<aura>.stacks           -> int
debuff.<aura>.refreshable      -> bool

dot.<name>.ticking             -> bool
dot.<name>.remaining           -> float
dot.<name>.refreshable         -> bool
dot.<name>.ticks_remaining     -> int

target.health_percent          -> float
target.time_to_die             -> float
target.distance                -> float

enemy.count                    -> int

combat.time                    -> float
combat.remaining               -> float

gcd.remaining                  -> float
gcd.duration                   -> float

pet.active                     -> bool
pet.remaining                  -> float
pet.buff.<aura>.active         -> bool

talent.<name>                  -> bool

equipped.<item>                -> bool

trinket.<slot>.ready           -> bool
trinket.<slot>.remaining       -> float

spell.<name>.cost              -> float
spell.<name>.cast_time         -> float
```

---

## Problems With Current API

### 1. Spells Referenced by Internal Name

```json
{ "cast": "kill_command" }
```

`kill_command` is an internal snake_case name defined in Rust code. The actual spell is "Kill Command" (ID 34026). Users don't know internal names.

### 2. Auras Referenced by Internal Name

```json
"buff.frenzy.active"
```

`frenzy` is internal. The buff is "Frenzy" (ID 272790). Same problem.

### 3. No Schema Discovery

No way to ask "what spells exist for this spec?" without WASM + JIT. The API should be self-describing.

### 4. Silent Failures on Typos

```json
"buff.frenzy.actve"  // typo: "actve" instead of "active"
```

This silently becomes a user variable reference instead of an error. Bad.

### 5. JSONLogic is Verbose

```json
{ "and": [
  { "<": ["cd.bestial_wrath.remaining", 3] },
  { "<": ["resource.focus", 70] }
]}
```

Operators as keys is weird. Could be cleaner.

### 6. Inconsistent Action Format

```json
{ "cast": "spell", "if": ... }      // value in "cast" key
{ "wait": 1.5, "if": ... }          // value in "wait" key
{ "use_trinket": 1, "if": ... }     // value in "use_trinket" key
```

Sometimes the action type key holds the value. Inconsistent.

---

## Engine Source Files

```
crates/engine/src/rotation/
├── ast.rs       # Rotation, Action, Expr, VarPath structs
├── parser.rs    # JSON parser (string -> AST)
├── compiler.rs  # AST -> executable
├── resolver.rs  # Name resolution
├── validate.rs  # Validation + schema export
├── context.rs   # Runtime context
├── action.rs    # Action execution
├── error.rs     # Error types
└── mod.rs       # Module exports
```

---

## WASM Exports (Current)

From `crates/engine/src/wasm_exports.rs`:

```rust
getVarPathSchema() -> Vec<VarPathCategory>  // All variable paths
parseRotation(json) -> Rotation              // Parse JSON to AST
validateRotation(json) -> ValidationResult   // Validate rotation

// Require JIT feature:
getSpellDefs(specId) -> Vec<SpellDefInfo>   // Spells for a spec
getAuraDefs(specId) -> Vec<AuraDefInfo>     // Auras for a spec
getTalentNames(specId) -> Vec<String>       // Talents for a spec
```

---

## Design Questions

1. **Spell/Aura references**: Use display names? IDs? Slugs?
2. **Expression syntax**: Keep JSONLogic? Make it more readable?
3. **Action format**: Normalize structure?
4. **Type safety**: Catch typos at parse time?
5. **Schema**: Self-describing? Embedded? Separate endpoint?

---

## DO NOT

1. **Do not look at the portal** - It's irrelevant. Engine defines API.
2. **Do not write converters** - Design the right API first.
3. **Do not copy SimC** - It's optimized for typing, not reading.
4. **Do not abbreviate** - Use full words. `cooldown` not `cd`, `condition` not `if`.
5. **Do not over-engineer** - Simple and readable beats clever and compact.
6. **Do not let the UI influence the API** - The API is the source of truth. UI adapts.

---

## PROMPT FOR FRESH CLAUDE INSTANCE

Copy everything below this line and give it to a fresh Claude instance:

---

# Task: Design a Clean Rotation API for the WoW Simulation Engine

You are designing a JSON API for defining combat rotations in a World of Warcraft simulation engine. This API is the ONLY source of truth - all other systems (UI, database, tools) will consume this API. You are not adapting to anything else. You are defining the standard.

## Your Deliverables

1. **Complete API specification** - JSON schema for rotations
2. **Example rotation** - A full BM Hunter rotation in the new format
3. **Migration notes** - What changes from current format
4. **Rust type definitions** - The AST structs that will parse this

## Context

Read the current API documentation above this prompt. It shows:
- The current format (JSONLogic-style)
- All variable paths the engine supports
- The 6 problems with the current API
- Design goals (human readable, not SimC)

## Requirements

### 1. Human Readable
Someone should read a rotation JSON and understand it WITHOUT documentation.

**This is readable:**
```json
{
  "action": "cast",
  "spell": "Kill Command",
  "condition": {
    "and": [
      { "cooldown": { "spell": "Kill Command", "is": "ready" } },
      { "resource": { "type": "focus", ">=": 30 } }
    ]
  }
}
```

**This is NOT readable:**
```json
{ "cast": "kill_command", "if": { "and": ["cd.kill_command.ready", { ">=": ["resource.focus", 30] }] } }
```

### 2. Consistent Structure
All actions should have the same shape. No "sometimes the key is the value" nonsense.

**Consistent:**
```json
{ "action": "cast", "spell": "Kill Command", "condition": ... }
{ "action": "wait", "duration": 1.5, "condition": ... }
{ "action": "use_trinket", "slot": 1, "condition": ... }
```

**Inconsistent (current):**
```json
{ "cast": "kill_command", "if": ... }
{ "wait": 1.5, "if": ... }
{ "use_trinket": 1, "if": ... }
```

### 3. No Abbreviations
Use full words. `cooldown` not `cd`. `condition` not `if`. `active` not `up`.

### 4. Spell/Aura References
Decide how to reference spells and auras:
- By display name: `"Kill Command"`
- By ID: `34026`
- By slug: `"kill-command"`

Consider: How will validation work? How will the engine resolve names to internal IDs?

### 5. Type-Safe Conditions
The current format silently treats typos as user variables. Design conditions so typos are caught at parse time.

### 6. Self-Describing
The API should make it easy to discover what's available. Consider embedding schema info or providing clear error messages.

## What NOT To Do

1. **Do not look at apps/portal** - It's broken garbage. Ignore it completely.
2. **Do not write a converter** - Design the right API. Migration is a separate concern.
3. **Do not copy SimC syntax** - `actions+=/kill_command,if=cd.ready&focus>=30` is unreadable trash.
4. **Do not optimize for typing speed** - Optimize for reading and understanding.
5. **Do not use JSONLogic** - `{ "<": [a, b] }` with operator-as-key is awkward. Find something better.
6. **Do not ask "what does the UI need"** - The engine defines the API. Period.

## Engine Files to Reference

If you need to understand the current implementation:
```
crates/engine/src/rotation/
├── ast.rs       # Current AST types
├── parser.rs    # Current JSON parser
├── validate.rs  # Validation + schema
```

## Output Format

Structure your response as:

1. **API Overview** - High-level structure
2. **Action Types** - All action types with examples
3. **Condition System** - How conditions work
4. **Variable Paths** - How to reference game state
5. **Full Example** - Complete BM Hunter rotation
6. **Rust Types** - The structs that parse this
7. **Rationale** - Why you made each decision

Be thorough. Be specific. Show complete examples, not fragments. This will be implemented directly from your design.
