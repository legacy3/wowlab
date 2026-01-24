---
name: game-data
description: Work with WoW spell, item, and DBC data in portal. Use when fetching, displaying, or adding new game data types.
---

# Game Data - READ THIS FIRST

## The Rules

1. **ALL game data comes from the database** - NEVER hardcode
2. **Apps ONLY use flat data structures** - `SpellDataFlat`, `ItemDataFlat`
3. **Transformers assemble flat structures from DBC tables** - Apps never query DBC directly
4. **If data isn't available via a transformer, ASK** - Don't improvise

## The Architecture

```
Supabase (raw_dbc schema)     →  Transformer (wowlab-services)  →  Flat Structure  →  App Hook  →  UI
├── spell_name                    transformSpell()                  SpellDataFlat      useSpell()
├── spell_effect                  (joins 15+ tables)
├── spell_misc
├── spell_categories
├── spell_cooldowns
├── spell_duration
├── spell_range
├── ... (15+ more)

├── item                          transformItem()                   ItemDataFlat       useItem()
├── item_sparse                   (joins 8+ tables)
├── item_x_item_effect
├── item_effect
├── item_modified_appearance
├── item_appearance
├── ... (more)
```

## Flat Data Structures

Defined in `packages/wowlab-core/src/internal/schemas/`:

### SpellDataFlat (`Spell.ts`)

```ts
{
  // Core
  id: SpellID,
  name: string,
  description: string,
  auraDescription: string,
  fileName: string,              // Icon filename
  isPassive: boolean,
  knowledgeSource: KnowledgeSource,

  // Timing
  castTime: number,
  recoveryTime: number,          // Cooldown
  startRecoveryTime: number,     // GCD

  // Resources
  manaCost: number,
  powerCost: number,
  powerCostPct: number,
  powerType: number,

  // Charges
  maxCharges: number,
  chargeRecoveryTime: number,

  // Range
  rangeMin0: number, rangeMax0: number,  // Enemy
  rangeMin1: number, rangeMax1: number,  // Ally

  // Geometry
  radiusMin: number, radiusMax: number,
  coneDegrees: number,

  // Combat
  schoolMask: number,
  defenseType: number,
  effectBonusCoefficient: number,   // SP scaling
  bonusCoefficientFromAP: number,   // AP scaling

  // Duration
  duration: number,
  maxDuration: number,

  // And more: interrupts, empower, mechanics, levels, aura restrictions,
  // replacement, shapeshift, totems, attributes, triggers, learnSpells...
}
```

### ItemDataFlat (`Item.ts`)

```ts
{
  // Basic
  id: number,
  name: string,
  description: string,
  fileName: string,              // Icon filename
  quality: number,
  itemLevel: number,
  requiredLevel: number,
  binding: number,

  // Classification
  classId: number,
  subclassId: number,
  inventoryType: number,
  classification: {
    className: string,
    subclassName: string,
    inventoryTypeName: string,
    expansionId: number,
    expansionName: string,
  },

  // Stats & Effects
  stats: Array<{ type: number, value: number }>,
  effects: Array<{ spellId: number, triggerType: number, cooldown: number, ... }>,

  // Sockets, flags, restrictions, set info, drop sources...
}
```

## Transformers

Located in `packages/wowlab-services/src/internal/data/transformer/`:

- `spell.ts` / `spell-impl.ts` - `transformSpell(id)` → `SpellDataFlat`
- `item.ts` - `transformItem(id)` → `ItemDataFlat`
- `extractors.ts` - `ExtractorService` for field-specific extraction

Transformers use `DbcService` to fetch from multiple DBC tables and assemble the flat structure.

## App Hooks

In `apps/portal/src/lib/state/dbc.ts`:

```tsx
import { useSpell, useItem } from "@/lib/state";

// These return the FLAT structures, already transformed
const spell = useSpell(spellId);   // → SpellDataFlat
const item = useItem(itemId);      // → ItemDataFlat

// Usage
if (spell.data) {
  console.log(spell.data.name);        // "Fireball"
  console.log(spell.data.castTime);    // 2500
  console.log(spell.data.fileName);    // "spell_fire_fireball02"
}
```

## What To Do When Data Is Missing

### Scenario 1: Field exists in flat structure but is wrong/incomplete
→ Fix the transformer in `wowlab-services`

### Scenario 2: Need a field that's in DBC but not in flat structure
→ Add field to schema in `wowlab-core`, update transformer in `wowlab-services`

### Scenario 3: Need entirely new entity type
→ ASK THE USER. They need to decide:
  - What DBC tables to use
  - What the flat structure should look like
  - Where the transformer goes

### Scenario 4: Need data that might not be in DBC at all
→ ASK THE USER. Don't guess. Don't hardcode.

## NEVER DO THIS

```tsx
// WRONG - Hardcoded game data
const SPELL_SCHOOLS = { 1: "Physical", 2: "Holy", 4: "Fire" };
const CLASS_NAMES = ["Warrior", "Paladin", "Hunter"];
const ITEM_QUALITIES = ["Poor", "Common", "Uncommon", "Rare", "Epic"];

// WRONG - Direct DBC query in app
const { data } = useList({ resource: "spell_name", meta: { schema: "raw_dbc" } });

// WRONG - Guessing spell data
const fireball = { id: 133, name: "Fireball", castTime: 2500 };
```

## ALWAYS DO THIS

```tsx
// RIGHT - Use the hook, get flat structure
const spell = useSpell(spellId);
const item = useItem(itemId);

// RIGHT - Access fields from flat structure
const spellName = spell.data?.name;
const iconFile = spell.data?.fileName;
const castTime = spell.data?.castTime;

// RIGHT - If you need something that doesn't exist
// ASK: "I need X data. Should I add it to the transformer or is there another way?"
```

## Research - DO THIS BEFORE ASKING

**Use Supabase MCP to research before asking the user anything.**

```sql
-- Find tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'raw_dbc' AND table_name LIKE '%power%';

-- Query data
SELECT * FROM raw_dbc.chr_classes LIMIT 5;
```

### Research workflow
1. Check if data exists in current flat structures
2. If not, search for DBC table via Supabase SQL
3. If table exists, check columns
4. If table doesn't exist in Supabase but you need it, tell the user - they can add it from game files

## There Are No Hardcoded Constants

**ALL game data exists in DBC/DB2 files.** If a table isn't in Supabase yet, the user can add it. Never assume something needs to be hardcoded. Examples of data that IS in game files:

- Power type labels → `UnitPowerBarInfo` or similar
- Item quality colors → `ItemQuality` or UI tables
- Spell school colors → UI texture/color tables
- Class colors → `chr_classes.ClassColorR/G/B`

If you can't find it, ask: "I need X data. I searched for Y tables but didn't find it. Which DBC table has this?"
