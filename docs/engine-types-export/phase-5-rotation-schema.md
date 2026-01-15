# Phase 5: Rotation Schema - Export Existing Engine Types

## Objective

Export the existing engine rotation types (`Rotation`, `Expr`, `VarPath`, `Action`) to TypeScript.

## Prerequisites

- Phases 1-4 complete
- Engine types and spec registry exported

## Design Decision: Export Existing Types

The engine already has:

```rust
// crates/engine/src/rotation/ast.rs
pub struct Rotation {
    pub name: String,
    pub variables: HashMap<String, Expr>,
    pub lists: HashMap<String, Vec<Action>>,
    pub actions: Vec<Action>,
}

pub enum Expr {
    Bool(bool),
    Int(i64),
    Float(f64),
    Var(VarPath),
    UserVar(String),
    And(Vec<Expr>),
    Or(Vec<Expr>),
    Not(Box<Expr>),
    Gt(Box<Expr>, Box<Expr>),
    Gte(Box<Expr>, Box<Expr>),
    Lt(Box<Expr>, Box<Expr>),
    Lte(Box<Expr>, Box<Expr>),
    Eq(Box<Expr>, Box<Expr>),
    Ne(Box<Expr>, Box<Expr>),
    Add(Box<Expr>, Box<Expr>),
    Sub(Box<Expr>, Box<Expr>),
    Mul(Box<Expr>, Box<Expr>),
    Div(Box<Expr>, Box<Expr>),
    Mod(Box<Expr>, Box<Expr>),
    Neg(Box<Expr>),
    Floor(Box<Expr>),
    Ceil(Box<Expr>),
    Abs(Box<Expr>),
    Min(Box<Expr>, Box<Expr>),
    Max(Box<Expr>, Box<Expr>),
    Ternary(Box<Expr>, Box<Expr>, Box<Expr>),
}

pub enum VarPath {
    CdReady(String),
    CdRemains(String),
    CdCharges(String),
    BuffActive(String),
    BuffRemains(String),
    BuffStacks(String),
    DebuffActive(String),
    DebuffRemains(String),
    DebuffStacks(String),
    DotTicking(String),
    DotRemains(String),
    Resource(String),
    ResourcePct(String),
    ResourceDeficit(String),
    TalentEnabled(String),
    // ... 40+ more variants
}

pub enum Action {
    Cast { spell: String, condition: Option<Expr> },
    Call { list: String, condition: Option<Expr> },
    Run { list: String, condition: Option<Expr> },
    SetVar { name: String, value: Expr, condition: Option<Expr> },
    ModifyVar { name: String, op: ModifyOp, value: Expr, condition: Option<Expr> },
    Wait { seconds: f64, condition: Option<Expr> },
    WaitUntil { condition: Expr },
    Pool { extra: Option<f64>, condition: Option<Expr> },
    UseTrinket { slot: u8, condition: Option<Expr> },
    UseItem { name: String, condition: Option<Expr> },
}
```

## Implementation

### 1. Add Tsify Derives to Existing Types

Update `crates/engine/src/rotation/ast.rs`:

```rust
use serde::{Serialize, Deserialize};
#[cfg(feature = "wasm")]
use tsify::Tsify;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[serde(rename_all = "camelCase")]
pub struct Rotation {
    pub name: String,
    pub variables: HashMap<String, Expr>,
    pub lists: HashMap<String, Vec<Action>>,
    pub actions: Vec<Action>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[serde(rename_all = "camelCase")]
pub enum Expr {
    #[serde(rename = "bool")]
    Bool(bool),
    #[serde(rename = "int")]
    Int(i64),
    #[serde(rename = "float")]
    Float(f64),
    #[serde(rename = "var")]
    Var(VarPath),
    #[serde(rename = "userVar")]
    UserVar(String),
    #[serde(rename = "and")]
    And(Vec<Expr>),
    #[serde(rename = "or")]
    Or(Vec<Expr>),
    #[serde(rename = "not")]
    Not(Box<Expr>),
    #[serde(rename = "gt")]
    Gt(Box<Expr>, Box<Expr>),
    // ... etc
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[serde(rename_all = "camelCase", tag = "type")]
pub enum VarPath {
    CdReady { spell: String },
    CdRemains { spell: String },
    CdCharges { spell: String },
    BuffActive { aura: String },
    BuffRemains { aura: String },
    BuffStacks { aura: String },
    DebuffActive { aura: String },
    DebuffRemains { aura: String },
    DebuffStacks { aura: String },
    DotTicking { aura: String },
    DotRemains { aura: String },
    Resource { name: String },
    ResourcePct { name: String },
    ResourceDeficit { name: String },
    TalentEnabled { name: String },
    // ... 40+ more
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[serde(rename_all = "camelCase", tag = "type")]
pub enum Action {
    Cast { spell: String, condition: Option<Expr> },
    Call { list: String, condition: Option<Expr> },
    Run { list: String, condition: Option<Expr> },
    SetVar { name: String, value: Expr, condition: Option<Expr> },
    ModifyVar { name: String, op: ModifyOp, value: Expr, condition: Option<Expr> },
    Wait { seconds: f64, condition: Option<Expr> },
    WaitUntil { condition: Expr },
    Pool { extra: Option<f64>, condition: Option<Expr> },
    UseTrinket { slot: u8, condition: Option<Expr> },
    UseItem { name: String, condition: Option<Expr> },
}
```

### 2. Add Validation WASM Export

Add to `crates/engine/src/wasm_exports.rs`:

```rust
use crate::rotation::{Rotation, validate_rotation, ValidationResult, ValidationError};

#[derive(Debug, Clone, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi)]
#[serde(rename_all = "camelCase")]
pub struct RotationValidationResult {
    pub valid: bool,
    pub errors: Vec<RotationValidationError>,
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct RotationValidationError {
    pub path: String,
    pub message: String,
    pub error_type: String,
}

#[wasm_bindgen(js_name = validateRotation)]
pub fn wasm_validate_rotation(json: &str) -> RotationValidationResult {
    match serde_json::from_str::<Rotation>(json) {
        Ok(rotation) => {
            let result = validate_rotation(&rotation);
            RotationValidationResult {
                valid: result.errors.is_empty(),
                errors: result.errors.into_iter().map(|e| RotationValidationError {
                    path: e.path,
                    message: e.message,
                    error_type: format!("{:?}", e.error_type),
                }).collect(),
                warnings: result.warnings,
            }
        }
        Err(e) => RotationValidationResult {
            valid: false,
            errors: vec![RotationValidationError {
                path: "".into(),
                message: format!("Invalid JSON: {}", e),
                error_type: "ParseError".into(),
            }],
            warnings: vec![],
        }
    }
}

#[wasm_bindgen(js_name = parseRotation)]
pub fn wasm_parse_rotation(json: &str) -> JsValue {
    match serde_json::from_str::<Rotation>(json) {
        Ok(r) => serde_wasm_bindgen::to_value(&r).unwrap_or(JsValue::NULL),
        Err(_) => JsValue::NULL,
    }
}

/// Get available VarPath categories for building expression editors
#[wasm_bindgen(js_name = getVarPathSchema)]
pub fn get_var_path_schema() -> JsValue {
    // Return structured schema of all VarPath variants
    let schema = vec![
        ("cooldown", vec!["cd.ready", "cd.remains", "cd.charges", "cd.fullRechargeTime"]),
        ("buff", vec!["buff.active", "buff.remains", "buff.stacks", "buff.refreshable"]),
        ("debuff", vec!["debuff.active", "debuff.remains", "debuff.stacks"]),
        ("resource", vec!["resource", "resource.pct", "resource.deficit", "resource.max"]),
        ("talent", vec!["talent.enabled"]),
        ("target", vec!["target.health.pct", "target.timeTodie", "target.distance"]),
        ("combat", vec!["combat.time", "combat.remains", "fightRemains"]),
        // ... etc
    ];
    serde_wasm_bindgen::to_value(&schema).unwrap()
}
```

### 3. Create/Update Validation Module

Create `crates/engine/src/rotation/validate.rs`:

```rust
use super::ast::{Rotation, Expr, Action, VarPath};
use std::collections::HashSet;

#[derive(Debug)]
pub struct ValidationResult {
    pub errors: Vec<ValidationError>,
    pub warnings: Vec<String>,
}

#[derive(Debug)]
pub struct ValidationError {
    pub path: String,
    pub message: String,
    pub error_type: ErrorType,
}

#[derive(Debug)]
pub enum ErrorType {
    CircularReference,
    UnknownVariable,
    UnknownList,
    InvalidSpellName,
    EmptyList,
    ParseError,
}

pub fn validate_rotation(rotation: &Rotation) -> ValidationResult {
    let mut errors = Vec::new();
    let mut warnings = Vec::new();

    // Check for circular list references
    check_circular_refs(&rotation.lists, &mut errors);

    // Validate variable references
    let var_names: HashSet<_> = rotation.variables.keys().collect();
    for (list_name, actions) in &rotation.lists {
        for (i, action) in actions.iter().enumerate() {
            validate_action_vars(action, &var_names, &format!("lists.{}.{}", list_name, i), &mut errors);
        }
    }

    // Check for empty lists (warning)
    for (name, actions) in &rotation.lists {
        if actions.is_empty() {
            warnings.push(format!("List '{}' is empty", name));
        }
    }

    ValidationResult { errors, warnings }
}

fn check_circular_refs(lists: &HashMap<String, Vec<Action>>, errors: &mut Vec<ValidationError>) {
    // DFS to detect cycles in call/run references
    // ...
}

fn validate_action_vars(action: &Action, vars: &HashSet<&String>, path: &str, errors: &mut Vec<ValidationError>) {
    // Check that UserVar references exist
    // ...
}
```

## Generated TypeScript

```typescript
// Rotation types - exported from engine's existing AST
export interface Rotation {
  name: string;
  variables: Record<string, Expr>;
  lists: Record<string, Action[]>;
  actions: Action[];
}

export type Expr =
  | { bool: boolean }
  | { int: number }
  | { float: number }
  | { var: VarPath }
  | { userVar: string }
  | { and: Expr[] }
  | { or: Expr[] }
  | { not: Expr }
  | { gt: [Expr, Expr] }
  | { gte: [Expr, Expr] }
  | { lt: [Expr, Expr] }
  | { lte: [Expr, Expr] }
  | { eq: [Expr, Expr] }
  | { ne: [Expr, Expr] }
  | { add: [Expr, Expr] }
  | { sub: [Expr, Expr] }
  | { mul: [Expr, Expr] }
  | { div: [Expr, Expr] }
  | { mod: [Expr, Expr] }
  | { neg: Expr }
  | { floor: Expr }
  | { ceil: Expr }
  | { abs: Expr }
  | { min: [Expr, Expr] }
  | { max: [Expr, Expr] }
  | { ternary: [Expr, Expr, Expr] };

export type VarPath =
  | { type: "CdReady"; spell: string }
  | { type: "CdRemains"; spell: string }
  | { type: "CdCharges"; spell: string }
  | { type: "BuffActive"; aura: string }
  | { type: "BuffRemains"; aura: string }
  | { type: "BuffStacks"; aura: string }
  | { type: "DebuffActive"; aura: string }
  | { type: "TalentEnabled"; name: string }
  | { type: "Resource"; name: string }
  | { type: "ResourcePct"; name: string }
  // ... 40+ more variants

export type Action =
  | { type: "Cast"; spell: string; condition?: Expr }
  | { type: "Call"; list: string; condition?: Expr }
  | { type: "Run"; list: string; condition?: Expr }
  | { type: "SetVar"; name: string; value: Expr; condition?: Expr }
  | { type: "ModifyVar"; name: string; op: ModifyOp; value: Expr; condition?: Expr }
  | { type: "Wait"; seconds: number; condition?: Expr }
  | { type: "WaitUntil"; condition: Expr }
  | { type: "Pool"; extra?: number; condition?: Expr }
  | { type: "UseTrinket"; slot: number; condition?: Expr }
  | { type: "UseItem"; name: string; condition?: Expr };

// Functions
export function validateRotation(json: string): RotationValidationResult;
export function parseRotation(json: string): Rotation | null;
export function getVarPathSchema(): [string, string[]][];
```

## Portal Usage

```typescript
import { validateRotation, parseRotation, type Rotation, type Expr } from "@/lib/engine";

// Validate rotation JSON before saving
const result = await validateRotation(JSON.stringify(rotation));
if (!result.valid) {
  console.error(result.errors);
}

// Parse rotation from Supabase
const rotation = await parseRotation(row.script);

// Build expression
const expr: Expr = {
  and: [
    { var: { type: "CdReady", spell: "kill_command" } },
    { gt: [{ var: { type: "Resource", name: "focus" } }, { int: 50 }] }
  ]
};
```

## Success Criteria

- [ ] Existing `Rotation`, `Expr`, `VarPath`, `Action` types have Tsify derives
- [ ] Generated `.d.ts` includes full rotation type system
- [ ] `validateRotation()` WASM function works
- [ ] `parseRotation()` WASM function works
- [ ] Portal uses engine's rotation format directly

---

## Prompt for Fresh Claude Instance

```
I'm working on Phase 5 of the engine-types-export plan for the wowlab project.

GOAL: Export the engine rotation types to TypeScript.

CONTEXT:
- Phases 1-4 complete: engine types exported via WASM to portal
- Engine has Rotation, Expr, VarPath, Action types in src/rotation/ast.rs

TASKS:
1. Add Tsify/Serde derives to existing types in crates/engine/src/rotation/ast.rs:
   - Rotation struct
   - Expr enum (with all math/logic operations)
   - VarPath enum (with 40+ game value variants)
   - Action enum (Cast, Call, SetVar, etc.)

2. Create crates/engine/src/rotation/validate.rs:
   - ValidationResult, ValidationError types
   - validate_rotation() function (circular refs, unknown vars, etc.)

3. Add WASM exports:
   - validateRotation(json) -> ValidationResult
   - parseRotation(json) -> Rotation | null
   - getVarPathSchema() -> categorized list of VarPath variants

4. VarPath serialization:
   - Use #[serde(tag = "type")] for discriminated unions
   - Names are camelCase in JSON

Start by reading crates/engine/src/rotation/ast.rs to see the existing types.
```
