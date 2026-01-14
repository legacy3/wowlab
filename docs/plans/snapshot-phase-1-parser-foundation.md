# Phase 1: Snapshot Parser Foundation

## Context

You are building a Rust crate (`crates/snapshot-parser`) that ports the TypeScript extraction logic (~3000 lines across multiple files) to Rust. This transforms raw DBC CSV data into pre-computed flat structures (SpellDataFlat, TalentTreeFlat, ItemDataFlat, AuraDataFlat) that will be stored in Supabase Postgres.

**Key insight:** The transformation logic (joining 20+ tables per spell) runs once at snapshot time, not at query time. Portal/MCP/Engine all query pre-computed flat tables.

## Reference: Existing TypeScript Implementation

The extraction logic lives in `old/packages/wowlab-services/src/internal/data/transformer/`:

| File            | Lines | Purpose                                          |
| --------------- | ----- | ------------------------------------------------ |
| `extractors.ts` | ~1370 | 30+ extraction functions (ExtractorService)      |
| `spell-impl.ts` | ~350  | SpellDataFlat assembly (transformSpellWith)      |
| `talent.ts`     | ~765  | Talent tree transformation (transformTalentTree) |
| `item.ts`       | ~345  | Item transformation (transformItem)              |
| `aura.ts`       | ~120  | Aura transformation (transformAura)              |

Schemas live in `old/packages/wowlab-core/src/internal/schemas/`:

| File       | Purpose                          |
| ---------- | -------------------------------- |
| `Spell.ts` | SpellDataFlatSchema (60+ fields) |
| `Item.ts`  | ItemDataFlatSchema               |
| `Aura.ts`  | AuraDataFlatSchema               |
| `Spec.ts`  | SpecDataFlatSchema               |

Talent string decoding lives in `old/packages/wowlab-parsers/src/internal/simc/talents.ts`.

Study these files carefully. The Rust implementation must produce identical output.

## Project Structure

```
wowlab/
├── crates/
│   └── snapshot-parser/     # YOU ARE CREATING THIS
│       ├── Cargo.toml
│       └── src/
│           ├── lib.rs
│           ├── dbc/         # DBC CSV parsing (raw tables)
│           ├── transform/   # Raw DBC → Flat transformation (port from TS)
│           ├── flat/        # Flat output types (SpellDataFlat, etc.)
│           ├── talents/     # Talent string encode/decode
│           └── errors.rs
~/Source/wowlab-data/        # Raw DBC CSV files (input)
└── old/packages/            # TypeScript reference (READ ONLY)
```

## Objectives

1. Create the `crates/snapshot-parser` crate
2. Implement DBC CSV parsing for all required tables (~50 tables)
3. Port all extraction logic from TypeScript to Rust
4. Define flat output types matching TypeScript schemas exactly
5. Port talent string decode/encode from wowlab-parsers

## Directory Structure to Create

```
crates/snapshot-parser/
├── Cargo.toml
└── src/
    ├── lib.rs                   # Public API
    │
    ├── dbc/                     # Raw DBC table parsing
    │   ├── mod.rs
    │   ├── loader.rs            # Generic CSV loader with HashMap indexing
    │   ├── spell.rs             # Spell, SpellName, SpellMisc, SpellEffect, etc.
    │   ├── spell_power.rs       # SpellPower, SpellCooldowns, SpellCategories, etc.
    │   ├── talent.rs            # TraitNode, TraitNodeEntry, TraitDefinition, etc.
    │   ├── item.rs              # Item, ItemSparse, ItemEffect, ItemSet, etc.
    │   ├── character.rs         # ChrClasses, ChrSpecialization
    │   └── shared.rs            # ManifestInterfaceData, Difficulty, etc.
    │
    ├── transform/               # Ported extraction logic
    │   ├── mod.rs
    │   ├── spell.rs             # Port spell-impl.ts + spell extractors
    │   ├── extractors.rs        # Port extractors.ts (30+ functions)
    │   ├── talent.rs            # Port talent.ts (transformTalentTree)
    │   ├── item.rs              # Port item.ts
    │   ├── aura.rs              # Port aura.ts
    │   └── context.rs           # SpellKnowledgeContext, DamageConfig
    │
    ├── flat/                    # Output types (match TS schemas EXACTLY)
    │   ├── mod.rs
    │   ├── spell.rs             # SpellDataFlat (60+ fields)
    │   ├── talent.rs            # TalentTreeFlat, TalentNode, TalentNodeEntry
    │   ├── item.rs              # ItemDataFlat
    │   ├── aura.rs              # AuraDataFlat
    │   └── shared.rs            # KnowledgeSource, etc.
    │
    ├── talents/                 # Talent string encoding
    │   ├── mod.rs
    │   ├── decode.rs            # Port decodeTalentLoadout
    │   └── encode.rs            # Port encodeTalentLoadout
    │
    └── errors.rs                # Error types
```

## Cargo.toml

```toml
[package]
name = "snapshot-parser"
version = "0.1.0"
edition = "2021"

[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
csv = "1.3"
thiserror = "2"
tracing = "0.1"

# For talent string base64
data-encoding = "2"

[dev-dependencies]
insta = "1"  # Snapshot testing
```

## Complete Flat Types

### SpellDataFlat

Must match `SpellDataFlatSchema` from `old/packages/wowlab-core/src/internal/schemas/Spell.ts` exactly:

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "source")]
pub enum KnowledgeSource {
    #[serde(rename = "talent")]
    Talent { trait_definition_id: i32 },
    #[serde(rename = "spec")]
    Spec { spec_id: i32 },
    #[serde(rename = "class")]
    Class { class_id: i32 },
    #[serde(rename = "unknown")]
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct LearnSpell {
    pub learn_spell_id: i32,
    pub overrides_spell_id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct EmpowerStage {
    pub stage: i32,
    pub duration_ms: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpellDataFlat {
    // Core
    pub id: i32,
    pub name: String,
    pub description: String,
    pub aura_description: String,
    pub description_variables: String,
    pub file_name: String,
    pub is_passive: bool,
    pub knowledge_source: KnowledgeSource,

    // Timing
    pub cast_time: i32,
    pub recovery_time: i32,
    pub start_recovery_time: i32,

    // Resources
    pub mana_cost: i32,
    pub power_cost: i32,
    pub power_cost_pct: f64,
    pub power_type: i32,

    // Charges
    pub charge_recovery_time: i32,
    pub max_charges: i32,

    // Range (enemy index 0, ally index 1)
    pub range_max_0: f32,
    pub range_max_1: f32,
    pub range_min_0: f32,
    pub range_min_1: f32,

    // Geometry
    pub cone_degrees: f32,
    pub radius_max: f32,
    pub radius_min: f32,

    // Damage/Defense
    pub defense_type: i32,
    pub school_mask: i32,

    // Scaling
    pub bonus_coefficient_from_ap: f64,
    pub effect_bonus_coefficient: f64,

    // Interrupts
    pub interrupt_aura_0: i32,
    pub interrupt_aura_1: i32,
    pub interrupt_channel_0: i32,
    pub interrupt_channel_1: i32,
    pub interrupt_flags: i32,

    // Duration
    pub duration: i32,
    pub max_duration: i32,

    // Empower
    pub can_empower: bool,
    pub empower_stages: Vec<EmpowerStage>,

    // Mechanics
    pub dispel_type: i32,
    pub facing_caster_flags: i32,
    pub speed: f32,
    pub spell_class_mask_1: i32,
    pub spell_class_mask_2: i32,
    pub spell_class_mask_3: i32,
    pub spell_class_mask_4: i32,
    pub spell_class_set: i32,

    // Levels
    pub base_level: i32,
    pub max_level: i32,
    pub max_passive_aura_level: i32,
    pub spell_level: i32,

    // Aura Restrictions
    pub caster_aura_spell: i32,
    pub caster_aura_state: i32,
    pub exclude_caster_aura_spell: i32,
    pub exclude_caster_aura_state: i32,
    pub exclude_target_aura_spell: i32,
    pub exclude_target_aura_state: i32,
    pub target_aura_spell: i32,
    pub target_aura_state: i32,

    // Replacement
    pub replacement_spell_id: i32,

    // Shapeshift
    pub shapeshift_exclude_0: i32,
    pub shapeshift_exclude_1: i32,
    pub shapeshift_mask_0: i32,
    pub shapeshift_mask_1: i32,
    pub stance_bar_order: i32,

    // Totems
    pub required_totem_category_0: i32,
    pub required_totem_category_1: i32,
    pub totem_0: i32,
    pub totem_1: i32,

    // Arrays
    pub attributes: Vec<i32>,  // 16 attribute flags
    pub effect_trigger_spell: Vec<i32>,
    pub implicit_target: Vec<i32>,
    pub learn_spells: Vec<LearnSpell>,
}
```

### TalentTreeFlat

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TalentTreeFlat {
    pub spec_id: i32,
    pub spec_name: String,
    pub class_name: String,
    pub tree_id: i32,
    pub all_node_ids: Vec<i32>,  // For loadout string parsing
    pub nodes: Vec<TalentNode>,
    pub edges: Vec<TalentEdge>,
    pub sub_trees: Vec<TalentSubTree>,
    pub point_limits: PointLimits,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TalentNode {
    pub id: i32,
    pub pos_x: i32,
    pub pos_y: i32,
    pub max_ranks: i32,
    pub r#type: i32,  // 0=single, 1=tiered, 2=choice, 3=subtree_selection
    pub tree_index: i32,  // 1=class, 2=spec, 3=hero
    pub order_index: i32,
    pub sub_tree_id: i32,
    pub entries: Vec<TalentNodeEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TalentNodeEntry {
    pub id: i32,
    pub definition_id: i32,
    pub spell_id: i32,
    pub name: String,
    pub description: String,
    pub icon_file_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TalentEdge {
    pub id: i32,
    pub from_node_id: i32,
    pub to_node_id: i32,
    pub visual_style: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TalentSubTree {
    pub id: i32,
    pub name: String,
    pub description: String,
    pub icon_file_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PointLimits {
    pub class: i32,
    pub spec: i32,
    pub hero: i32,
}
```

### ItemDataFlat

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ItemDataFlat {
    // Basic
    pub id: i32,
    pub name: String,
    pub description: String,
    pub file_name: String,
    pub item_level: i32,
    pub quality: i32,
    pub required_level: i32,
    pub binding: i32,
    pub buy_price: i32,
    pub sell_price: i32,
    pub max_count: i32,
    pub stackable: i32,
    pub speed: i32,

    // Classification
    pub class_id: i32,
    pub subclass_id: i32,
    pub inventory_type: i32,
    pub classification: Option<ItemClassification>,

    // Stats & Effects
    pub stats: Vec<ItemStat>,
    pub effects: Vec<ItemEffect>,

    // Sockets
    pub sockets: Vec<i32>,
    pub socket_bonus_enchant_id: i32,

    // Flags
    pub flags: Vec<i32>,

    // Restrictions
    pub allowable_class: i32,
    pub allowable_race: i64,

    // Expansion & Set
    pub expansion_id: i32,
    pub item_set_id: i32,
    pub set_info: Option<ItemSetInfo>,

    // Drop sources
    pub drop_sources: Vec<ItemDropSource>,

    // Crafting
    pub dmg_variance: f32,
    pub gem_properties: i32,
    pub modified_crafting_reagent_item_id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ItemStat {
    pub r#type: i32,
    pub value: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ItemEffect {
    pub spell_id: i32,
    pub trigger_type: i32,
    pub charges: i32,
    pub cooldown: i32,
    pub category_cooldown: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ItemClassification {
    pub class_id: i32,
    pub class_name: String,
    pub subclass_id: i32,
    pub subclass_name: String,
    pub inventory_type: i32,
    pub inventory_type_name: String,
    pub expansion_id: i32,
    pub expansion_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ItemSetInfo {
    pub set_id: i32,
    pub set_name: String,
    pub item_ids: Vec<i32>,
    pub bonuses: Vec<ItemSetBonus>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ItemSetBonus {
    pub threshold: i32,
    pub spell_id: i32,
    pub spec_id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ItemDropSource {
    pub instance_id: i32,
    pub instance_name: String,
    pub encounter_id: i32,
    pub encounter_name: String,
    pub difficulty_mask: i32,
}
```

### AuraDataFlat

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuraDataFlat {
    pub spell_id: i32,
    pub base_duration_ms: i32,
    pub max_duration_ms: i32,
    pub max_stacks: i32,
    pub periodic_type: Option<PeriodicType>,
    pub tick_period_ms: i32,
    pub refresh_behavior: RefreshBehavior,
    pub duration_hasted: bool,
    pub hasted_ticks: bool,
    pub pandemic_refresh: bool,
    pub rolling_periodic: bool,
    pub tick_may_crit: bool,
    pub tick_on_application: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PeriodicType {
    Damage,
    Heal,
    Leech,
    Energize,
    TriggerSpell,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RefreshBehavior {
    Pandemic,
    Duration,
}
```

## Complete Extractor List

Port ALL of these from `extractors.ts`:

| Function                      | Priority | Input                                     | Output                                                 |
| ----------------------------- | -------- | ----------------------------------------- | ------------------------------------------------------ |
| `extractName`                 | P0       | spell_id                                  | String                                                 |
| `extractDescription`          | P0       | spell_id                                  | { description, aura_description }                      |
| `extractCastTime`             | P0       | SpellMisc                                 | Option<{ base, min }>                                  |
| `extractCooldown`             | P0       | spell_id                                  | Option<{ category, gcd, recovery }>                    |
| `extractDuration`             | P0       | SpellMisc                                 | Option<{ duration, max }>                              |
| `extractCharges`              | P0       | spell_id                                  | Option<{ max_charges, recharge_time }>                 |
| `extractPower`                | P0       | spell_id                                  | Option<{ power_cost, power_cost_pct, power_type }>     |
| `extractRange`                | P0       | SpellMisc                                 | Option<{ ally: {min,max}, enemy: {min,max} }>          |
| `extractRadius`               | P1       | SpellEffect[]                             | Vec<{ min, max, radius }>                              |
| `extractScaling`              | P0       | SpellEffect[]                             | { attack_power, spell_power }                          |
| `extractManaCost`             | P1       | SpellEffect[]                             | i32                                                    |
| `extractClassOptions`         | P0       | spell_id                                  | Option<{ mask1-4, class_set }>                         |
| `extractInterrupts`           | P1       | spell_id                                  | Option<{ aura_flags, channel_flags, interrupt_flags }> |
| `extractEmpower`              | P1       | spell_id                                  | Option<{ can_empower, stages }>                        |
| `extractTargetRestrictions`   | P1       | spell_id                                  | Option<{ cone_degrees, max_targets, ... }>             |
| `extractAuraRestrictions`     | P0       | spell_id                                  | Option<{ caster_aura_spell, ... }>                     |
| `extractLevels`               | P1       | spell_id                                  | Option<{ base_level, max_level, ... }>                 |
| `extractLearnSpells`          | P1       | spell_id                                  | Vec<{ learn_spell_id, overrides_spell_id }>            |
| `extractReplacement`          | P1       | spell_id                                  | Option<{ replacement_spell_id }>                       |
| `extractShapeshift`           | P1       | spell_id                                  | Option<{ exclude, mask, stance_bar_order }>            |
| `extractTotems`               | P1       | spell_id                                  | Option<{ required_categories, totems }>                |
| `extractDescriptionVariables` | P1       | spell_id                                  | Option<String>                                         |
| `extractAuraFlags`            | P0       | attributes[]                              | { duration_hasted, hasted_ticks, ... }                 |
| `extractPeriodicInfo`         | P0       | SpellEffect[]                             | { periodic_type, tick_period_ms }                      |
| `extractTalentName`           | P0       | TraitDefinition                           | String                                                 |
| `extractTalentDescription`    | P0       | TraitDefinition                           | String                                                 |
| `extractTalentIcon`           | P0       | TraitDefinition                           | String                                                 |
| `getEffectsForDifficulty`     | P1       | SpellEffect[], effect_type, difficulty_id | SpellEffect[]                                          |
| `hasAoeDamageEffect`          | P2       | SpellEffect[], difficulty_id              | bool                                                   |
| `getVarianceForDifficulty`    | P2       | SpellEffect[], difficulty_id              | f64                                                    |
| `getDamage`                   | P2       | SpellEffect, DamageConfig                 | i32                                                    |

**Priority:**

- P0: Required for basic spell/talent display
- P1: Required for complete data
- P2: Advanced features, can skip initially

## Talent String Decode/Encode

Port from `old/packages/wowlab-parsers/src/internal/simc/talents.ts`:

```rust
// crates/snapshot-parser/src/talents/mod.rs

pub struct DecodedTalentLoadout {
    pub version: u8,
    pub spec_id: u16,
    pub tree_hash: [u8; 16],
    pub nodes: Vec<DecodedTalentNode>,
}

pub struct DecodedTalentNode {
    pub selected: bool,
    pub purchased: bool,
    pub ranks_purchased: Option<u8>,
    pub choice_index: Option<u8>,
}

/// Decode a WoW talent loadout string (base64-like format)
pub fn decode_talent_loadout(talent_string: &str) -> Result<DecodedTalentLoadout, TalentError> {
    // Port from decodeTalentLoadout in talents.ts
    // Uses LSB-first bit reading from base64 characters
}

/// Encode selections back to a loadout string
pub fn encode_talent_loadout(loadout: &DecodedTalentLoadout) -> String {
    // Port from encodeTalentLoadout in talents.ts
}
```

## DBC Loader Pattern

```rust
// crates/snapshot-parser/src/dbc/loader.rs
use std::collections::HashMap;
use std::path::Path;

pub struct DbcData {
    // Spell tables
    pub spell_name: HashMap<i32, SpellNameRow>,
    pub spell: HashMap<i32, SpellRow>,
    pub spell_misc: HashMap<i32, SpellMiscRow>,  // keyed by SpellID
    pub spell_effect: HashMap<i32, Vec<SpellEffectRow>>,  // keyed by SpellID
    pub spell_cooldowns: HashMap<i32, SpellCooldownsRow>,  // keyed by SpellID
    pub spell_categories: HashMap<i32, SpellCategoriesRow>,  // keyed by SpellID
    pub spell_power: HashMap<i32, Vec<SpellPowerRow>>,  // keyed by SpellID
    // ... all other tables

    // Talent tables
    pub chr_specialization: HashMap<i32, ChrSpecializationRow>,
    pub chr_classes: HashMap<i32, ChrClassesRow>,
    pub trait_node: HashMap<i32, TraitNodeRow>,
    pub trait_node_entry: HashMap<i32, TraitNodeEntryRow>,
    // ... etc
}

impl DbcData {
    pub fn load_all(data_dir: &Path) -> Result<Self, DbcError> {
        // Load all CSV files into HashMaps
        // Index by primary key or foreign key as appropriate
    }

    // Helper methods matching TypeScript DbcService
    pub fn get_by_id<T>(&self, table: &HashMap<i32, T>, id: i32) -> Option<&T> {
        table.get(&id)
    }

    pub fn get_one_by_fk<T>(&self, table: &HashMap<i32, T>, fk: i32) -> Option<&T> {
        table.get(&fk)
    }

    pub fn get_many_by_fk<T>(&self, table: &HashMap<i32, Vec<T>>, fk: i32) -> &[T] {
        table.get(&fk).map(|v| v.as_slice()).unwrap_or(&[])
    }
}
```

## Transformation Pattern

```rust
// crates/snapshot-parser/src/transform/spell.rs
use crate::dbc::DbcData;
use crate::flat::SpellDataFlat;

pub struct SpellKnowledgeContext {
    pub class_id: Option<i32>,
    pub spec_id: Option<i32>,
    pub class_spell_ids: HashSet<i32>,
    pub talent_spell_id_to_trait_definition_id: HashMap<i32, i32>,
}

pub fn transform_spell(
    dbc: &DbcData,
    spell_id: i32,
    context: Option<&SpellKnowledgeContext>,
) -> Result<SpellDataFlat, TransformError> {
    // Port from transformSpellWith in spell-impl.ts

    let name_row = dbc.spell_name.get(&spell_id)
        .ok_or(TransformError::SpellNotFound(spell_id))?;

    let misc = dbc.spell_misc.get(&spell_id);
    let effects = dbc.get_many_by_fk(&dbc.spell_effect, spell_id);
    let categories = dbc.spell_categories.get(&spell_id);

    // Call extractors
    let cast_time = extract_cast_time(dbc, misc);
    let cooldown = extract_cooldown(dbc, spell_id);
    let duration = extract_duration(dbc, misc);
    // ... etc

    Ok(SpellDataFlat {
        id: spell_id,
        name: name_row.name_lang.clone(),
        // ... map all fields
    })
}

pub fn transform_all_spells(dbc: &DbcData) -> Result<Vec<SpellDataFlat>, TransformError> {
    let mut spells = Vec::new();
    for spell_id in dbc.spell_name.keys() {
        match transform_spell(dbc, *spell_id, None) {
            Ok(spell) => spells.push(spell),
            Err(e) => tracing::warn!("Failed to transform spell {}: {}", spell_id, e),
        }
    }
    Ok(spells)
}
```

## Verification Strategy

### Golden File Testing

Create golden files from TypeScript output and compare:

```rust
// tests/golden_tests.rs
use insta::assert_json_snapshot;

#[test]
fn test_spell_53351_kill_shot() {
    let dbc = load_test_dbc();
    let spell = transform_spell(&dbc, 53351, None).unwrap();
    assert_json_snapshot!("spell_53351", spell);
}

#[test]
fn test_talent_tree_253_bm_hunter() {
    let dbc = load_test_dbc();
    let tree = transform_talent_tree(&dbc, 253).unwrap();
    assert_json_snapshot!("talent_tree_253", tree);
}
```

### Test Spell IDs

Use these known spells for verification:

| ID     | Name            | Why                                      |
| ------ | --------------- | ---------------------------------------- |
| 53351  | Kill Shot       | BM Hunter, has charges, damage, cooldown |
| 34026  | Kill Command    | Focus cost, pet spell                    |
| 193455 | Bestial Wrath   | Buff with duration, cooldown             |
| 2643   | Multi-Shot      | AoE, no target cap                       |
| 19574  | Bloodlust (pet) | External buff reference                  |

### Comparison Script

```bash
#!/bin/bash
# Compare Rust output to TypeScript output

# Generate TypeScript output
cd old && pnpm tsx scripts/dump-spell.ts 53351 > /tmp/ts_53351.json

# Generate Rust output
cargo run -p snapshot-parser -- dump-spell 53351 > /tmp/rs_53351.json

# Compare
diff /tmp/ts_53351.json /tmp/rs_53351.json
```

## Checklist

### Setup

- [ ] Create `crates/snapshot-parser/Cargo.toml`
- [ ] Create `src/lib.rs` with public API
- [ ] Create `src/errors.rs` with thiserror types
- [ ] Add to workspace `Cargo.toml`

### Flat Types (must match TS exactly)

- [ ] Create `src/flat/mod.rs`
- [ ] Create `src/flat/spell.rs` with SpellDataFlat (60+ fields)
- [ ] Create `src/flat/talent.rs` with TalentTreeFlat
- [ ] Create `src/flat/item.rs` with ItemDataFlat
- [ ] Create `src/flat/aura.rs` with AuraDataFlat
- [ ] Create `src/flat/shared.rs` with KnowledgeSource, etc.

### DBC Parsing

- [ ] Create `src/dbc/mod.rs`
- [ ] Create `src/dbc/loader.rs` with DbcData struct
- [ ] Create DBC structs for all spell tables (~15 tables)
- [ ] Create DBC structs for all talent tables (~15 tables)
- [ ] Create DBC structs for all item tables (~10 tables)
- [ ] Create DBC structs for shared tables (~10 tables)

### Extractors (P0 - required)

- [ ] Port `extractName`
- [ ] Port `extractDescription`
- [ ] Port `extractCastTime`
- [ ] Port `extractCooldown`
- [ ] Port `extractDuration`
- [ ] Port `extractCharges`
- [ ] Port `extractPower`
- [ ] Port `extractRange`
- [ ] Port `extractScaling`
- [ ] Port `extractClassOptions`
- [ ] Port `extractAuraRestrictions`
- [ ] Port `extractAuraFlags`
- [ ] Port `extractPeriodicInfo`
- [ ] Port `extractTalentName`
- [ ] Port `extractTalentDescription`
- [ ] Port `extractTalentIcon`

### Extractors (P1 - complete data)

- [ ] Port `extractRadius`
- [ ] Port `extractManaCost`
- [ ] Port `extractInterrupts`
- [ ] Port `extractEmpower`
- [ ] Port `extractTargetRestrictions`
- [ ] Port `extractLevels`
- [ ] Port `extractLearnSpells`
- [ ] Port `extractReplacement`
- [ ] Port `extractShapeshift`
- [ ] Port `extractTotems`
- [ ] Port `extractDescriptionVariables`
- [ ] Port `getEffectsForDifficulty`

### Transformation

- [ ] Port `transformSpellWith` from spell-impl.ts
- [ ] Port `transformTalentTree` from talent.ts
- [ ] Port `transformItem` from item.ts
- [ ] Port `transformAura` from aura.ts
- [ ] Implement `transform_all_spells`
- [ ] Implement `transform_all_talent_trees`
- [ ] Implement `transform_all_items`

### Talent String Codec

- [ ] Create `src/talents/mod.rs`
- [ ] Port `decodeTalentLoadout` from talents.ts
- [ ] Port `encodeTalentLoadout` from talents.ts
- [ ] Port `applyDecodedTalents` from talent.ts

### Testing

- [ ] Create test fixture with sample CSVs
- [ ] Create golden file tests for known spells
- [ ] Create golden file tests for talent trees
- [ ] Create golden file tests for items
- [ ] Create comparison script
- [ ] Verify `cargo build -p snapshot-parser` succeeds
- [ ] Verify `cargo test -p snapshot-parser` passes

## Success Criteria

1. **Compiles**: `cargo build -p snapshot-parser` succeeds with no warnings
2. **Types Match**: All flat types have identical fields to TypeScript schemas
3. **Field Names Match**: camelCase in JSON output (serde rename_all)
4. **Transformation Works**: Given same CSV input, Rust produces identical JSON to TypeScript
5. **All Extractors Ported**: Every function in extractors.ts has a Rust equivalent
6. **Talent Codec Works**: Can round-trip talent strings (decode then encode)
7. **Tests Pass**: Golden file tests match expected output

## Notes

- This is the most complex phase - porting ~3000 lines of logic
- Use HashMap for fast lookups by ID (replacing Effect's DbcService)
- Preserve all field names exactly (camelCase in JSON via serde)
- The TypeScript uses Effect for async - Rust version is sync (all data in memory)
- Test with specific spell IDs where you know the expected output
- Some DBC tables are indexed by primary key, others by foreign key - match TypeScript behavior
- Talent tree transformation is the most complex - involves 15+ DBC table joins
