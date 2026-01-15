# Phase 4: Spec Registry - Export Implementation Coverage

## Objective

Expose which specs are implemented and their coverage (spells, auras, talents) via WASM exports.

## Prerequisites

- Phases 1-3 complete
- Engine types exportable to TypeScript

## Design: Extend SpecHandler Trait

Extend the existing `SpecHandler` trait with coverage methods:

```rust
// crates/engine/src/handler/mod.rs
pub trait SpecHandler: Send + Sync {
    // Existing methods
    fn spec_id(&self) -> SpecId;
    fn get_spell(&self, id: SpellIdx) -> Option<&SpellDef>;
    fn get_aura(&self, id: AuraIdx) -> Option<&AuraDef>;

    // NEW: Add coverage methods
    fn wow_spec_id(&self) -> u32;           // WoW API spec ID (253 for BM Hunter)
    fn wow_class_id(&self) -> u32;          // WoW API class ID (3 for Hunter)
    fn display_name(&self) -> &'static str; // "Beast Mastery Hunter"

    fn spell_ids(&self) -> Vec<SpellIdx>;   // All implemented spell IDs
    fn aura_ids(&self) -> Vec<AuraIdx>;     // All implemented aura IDs
    fn talent_names(&self) -> Vec<String>;  // All implemented talent names (may be empty)
}
```

## Implementation

### 1. Extend SpecHandler Trait

Update `crates/engine/src/handler/mod.rs`:

```rust
pub trait SpecHandler: Send + Sync {
    fn spec_id(&self) -> SpecId;
    fn get_spell(&self, id: SpellIdx) -> Option<&SpellDef>;
    fn get_aura(&self, id: AuraIdx) -> Option<&AuraDef>;
    fn spell_name_to_idx(&self, name: &str) -> Option<SpellIdx>;

    // Coverage methods
    fn wow_spec_id(&self) -> u32;
    fn wow_class_id(&self) -> u32;
    fn display_name(&self) -> &'static str;

    fn spell_definitions(&self) -> &[SpellDef];
    fn aura_definitions(&self) -> &[AuraDef];
    fn talent_names(&self) -> Vec<String>;  // Returns empty vec if not implemented
}
```

### 2. Implement for BM Hunter

Update `crates/engine/src/specs/hunter/bm/handler.rs`:

```rust
impl SpecHandler for BmHunter {
    fn wow_spec_id(&self) -> u32 { 253 }
    fn wow_class_id(&self) -> u32 { 3 }
    fn display_name(&self) -> &'static str { "Beast Mastery Hunter" }

    fn spell_definitions(&self) -> &[SpellDef] {
        &self.spells  // Assuming spells are stored in handler
    }

    fn aura_definitions(&self) -> &[AuraDef] {
        &self.auras
    }

    fn talent_names(&self) -> Vec<String> {
        talent_definitions()
            .iter()
            .map(|t| t.name.clone())
            .collect()
    }
}
```

### 3. Implement for MM Hunter

```rust
impl SpecHandler for MmHunter {
    fn wow_spec_id(&self) -> u32 { 254 }
    fn wow_class_id(&self) -> u32 { 3 }
    fn display_name(&self) -> &'static str { "Marksmanship Hunter" }

    fn spell_definitions(&self) -> &[SpellDef] { &self.spells }
    fn aura_definitions(&self) -> &[AuraDef] { &self.auras }

    fn talent_names(&self) -> Vec<String> {
        vec![]
    }
}
```

### 4. WASM Exports

Add to `crates/engine/src/wasm_exports.rs`:

```rust
use crate::handler::{HandlerRegistry, create_default_registry};

#[derive(Debug, Clone, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi)]
#[serde(rename_all = "camelCase")]
pub struct SpecInfo {
    pub id: String,
    pub wow_class_id: u32,
    pub wow_spec_id: u32,
    pub display_name: String,
    pub spell_count: u32,
    pub aura_count: u32,
    pub talent_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi)]
#[serde(rename_all = "camelCase")]
pub struct SpecCoverage {
    pub id: String,
    pub display_name: String,
    pub implemented_spell_ids: Vec<u32>,
    pub implemented_aura_ids: Vec<u32>,
    pub talent_names: Vec<String>,
}

// Cache the registry (created once)
use std::sync::OnceLock;
static REGISTRY: OnceLock<HandlerRegistry> = OnceLock::new();

fn get_registry() -> &'static HandlerRegistry {
    REGISTRY.get_or_init(create_default_registry)
}

#[wasm_bindgen(js_name = getImplementedSpecs)]
pub fn get_implemented_specs() -> Vec<SpecInfo> {
    let registry = get_registry();

    registry.specs().iter().map(|spec_id| {
        let handler = registry.get(*spec_id).unwrap();
        SpecInfo {
            id: format!("{:?}", spec_id).to_lowercase().replace(" ", "_"),
            wow_class_id: handler.wow_class_id(),
            wow_spec_id: handler.wow_spec_id(),
            display_name: handler.display_name().to_string(),
            spell_count: handler.spell_definitions().len() as u32,
            aura_count: handler.aura_definitions().len() as u32,
            talent_count: handler.talent_names().len() as u32,
        }
    }).collect()
}

#[wasm_bindgen(js_name = getSpecCoverage)]
pub fn get_spec_coverage(spec_id: u32) -> Option<SpecCoverage> {
    let registry = get_registry();
    let handler = registry.get_by_wow_id(spec_id)?;

    Some(SpecCoverage {
        id: format!("{:?}", handler.spec_id()).to_lowercase(),
        display_name: handler.display_name().to_string(),
        implemented_spell_ids: handler.spell_definitions()
            .iter()
            .map(|s| s.id.0)
            .collect(),
        implemented_aura_ids: handler.aura_definitions()
            .iter()
            .map(|a| a.id.0)
            .collect(),
        talent_names: handler.talent_names(),
    })
}

#[wasm_bindgen(js_name = getSpellDefs)]
pub fn get_spell_defs(spec_id: u32) -> JsValue {
    let registry = get_registry();
    match registry.get_by_wow_id(spec_id) {
        Some(handler) => {
            serde_wasm_bindgen::to_value(handler.spell_definitions()).unwrap_or(JsValue::NULL)
        }
        None => JsValue::NULL,
    }
}

#[wasm_bindgen(js_name = getAuraDefs)]
pub fn get_aura_defs(spec_id: u32) -> JsValue {
    let registry = get_registry();
    match registry.get_by_wow_id(spec_id) {
        Some(handler) => {
            serde_wasm_bindgen::to_value(handler.aura_definitions()).unwrap_or(JsValue::NULL)
        }
        None => JsValue::NULL,
    }
}
```

### 5. Add Helper to HandlerRegistry

```rust
// crates/engine/src/handler/registry.rs
impl HandlerRegistry {
    pub fn get_by_wow_id(&self, wow_spec_id: u32) -> Option<&dyn SpecHandler> {
        self.handlers.values()
            .find(|h| h.wow_spec_id() == wow_spec_id)
            .map(|h| h.as_ref())
    }

    pub fn specs(&self) -> Vec<SpecId> {
        self.handlers.keys().copied().collect()
    }
}
```

## ID Systems

| ID Type | Example | Usage |
|---------|---------|-------|
| `SpecId` enum | `SpecId::BeastMastery` | Internal engine enum |
| WoW spec_id | `253` | WoW API, Supabase joins |
| String ID | `"beast_mastery"` | JSON config, logs |

The WASM exports use **WoW spec_id** (u32) as the primary key since that's what Supabase and WoW API use.

## Generated TypeScript

```typescript
export interface SpecInfo {
  id: string;
  wowClassId: number;
  wowSpecId: number;
  displayName: string;
  spellCount: number;
  auraCount: number;
  talentCount: number;
}

export interface SpecCoverage {
  id: string;
  displayName: string;
  implementedSpellIds: number[];
  implementedAuraIds: number[];
  talentNames: string[];
}

export function getImplementedSpecs(): SpecInfo[];
export function getSpecCoverage(specId: number): SpecCoverage | undefined;
export function getSpellDefs(specId: number): SpellDef[] | null;
export function getAuraDefs(specId: number): AuraDef[] | null;
```

## Portal Usage

```typescript
import { getImplementedSpecs, getSpecCoverage } from "@/lib/engine";

// Get all implemented specs
const specs = await getImplementedSpecs();
// [{ id: "beast_mastery", wowSpecId: 253, spellCount: 35, ... }]

// Get coverage for specific spec
const coverage = await getSpecCoverage(253);
// { implementedSpellIds: [34026, 193455, ...], talentNames: ["killer_instinct", ...] }
```

## Success Criteria

- [ ] `SpecHandler` trait extended with coverage methods
- [ ] All handlers implement new methods
- [ ] `getImplementedSpecs()` returns all registered specs
- [ ] `getSpecCoverage(id)` returns implemented spell/aura IDs
- [ ] Portal can display coverage UI

---

## Prompt for Fresh Claude Instance

```
I'm working on Phase 4 of the engine-types-export plan for the wowlab project.

GOAL: Expose spec implementation coverage via WASM exports.

CONTEXT:
- Phases 1-3 complete: engine types exported via WASM to portal
- HandlerRegistry already registers specs

TASKS:
1. Extend SpecHandler trait with coverage methods:
   - wow_spec_id() -> u32
   - wow_class_id() -> u32
   - display_name() -> &'static str
   - spell_definitions() -> &[SpellDef]
   - aura_definitions() -> &[AuraDef]
   - talent_names() -> Vec<String>

2. Implement for BmHunter and MmHunter handlers

3. Add to wasm_exports.rs:
   - SpecInfo, SpecCoverage structs
   - getImplementedSpecs() - list all specs with counts
   - getSpecCoverage(specId) - get implemented IDs for a spec
   - getSpellDefs(specId), getAuraDefs(specId)

4. Add get_by_wow_id() helper to HandlerRegistry

KEY DESIGN:
- Use WoW API spec_id (253, 254) as primary key for WASM functions
- Derive coverage from handlers
- Cache registry with OnceLock

Start by reading crates/engine/src/handler/mod.rs to see existing SpecHandler trait.
```
