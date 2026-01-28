---
name: game-data
description: Work with WoW spell, item, and DBC data in portal. Use when fetching, displaying, or adding new game data types.
---

# Game Data - READ THIS FIRST

## The Rules

1. **ALL game data comes from Supabase** - NEVER hardcode
2. **Use the `game` schema** - Tables like `spells`, `items`, `classes`, `specs`, `auras`
3. **Types come from database.types.ts** - Use `GameRow<T>` or exported type aliases
4. **Use resource hooks** - `useResource`, `useResourceMany`, `useResourceList`
5. **If data isn't available, ASK** - Don't improvise or hardcode

## The Architecture

```
Supabase (game schema)  →  Resource Definition  →  Hook  →  Component
├── spells                  resources.ts            useResource()
├── items                                           useResourceMany()
├── classes                                         useResourceList()
├── specs
├── auras
├── global_colors
├── global_strings
├── specs_traits
```

## Types

Defined in `apps/portal/src/lib/supabase/types.ts`:

```ts
import type { Spell, Item, Class, Spec, Aura } from "@/lib/supabase/types";

// Or use the generic helper
import type { GameRow } from "@/lib/supabase/types";
type MySpell = GameRow<"spells">;
```

Available type aliases:

- `Spell` - Full spell data
- `Item` - Full item data
- `Class` - Class information
- `Spec` - Spec information
- `Aura` - Aura data (indexed by spell_id)
- `GlobalColor` - UI color constants
- `GlobalString` - Localized strings
- `SpecTraits` - Spec trait tree data

Summary types for lists:

- `SpellSummary` - id, name, file_name
- `ItemSummary` - id, name, file_name, quality, item_level
- `SpecSummary` - id, name, class_id, class_name, file_name

## Resource Definitions

Located in `apps/portal/src/lib/refine/resources.ts`:

```ts
import { spells, items, classes, specs, auras } from "@/lib/refine/resources";

// Use by spreading into hooks
const { data } = useResource<Spell>({ ...spells, id: spellId });
```

## Hooks

### Single Resource

```ts
import { useResource } from "@/lib/refine/hooks/use-resource";
import { spells } from "@/lib/refine/resources";
import type { Spell } from "@/lib/supabase/types";

function SpellCard({ spellId }: { spellId: number }) {
  const { data: spell, isLoading, error } = useResource<Spell>({
    ...spells,
    id: spellId,
    queryOptions: { enabled: !!spellId },
  });

  if (isLoading) return <Skeleton />;
  if (!spell) return null;

  return <div>{spell.name}</div>;
}
```

### Multiple Resources by ID

```ts
import { useResourceMany } from "@/lib/refine/hooks/use-resource";
import { spells } from "@/lib/refine/resources";
import type { Spell } from "@/lib/supabase/types";

function SpellList({ spellIds }: { spellIds: number[] }) {
  const { data: spellsData = [], isLoading } = useResourceMany<Spell>({
    ...spells,
    ids: spellIds,
    queryOptions: { enabled: spellIds.length > 0 },
  });

  // spellsData is Spell[]
}
```

### List with Filters/Sorting

```ts
import { useResourceList } from "@/lib/refine/hooks/use-resource";
import { specs } from "@/lib/refine/resources";
import type { SpecSummary } from "@/lib/supabase/types";

function SpecsList() {
  const { data: specsData = [], isLoading } = useResourceList<SpecSummary>({
    ...specs,
    meta: {
      ...specs.meta,
      select: "id, name, class_name, class_id, file_name", // Partial select
    },
    pagination: { mode: "off" },
    sorters: [
      { field: "class_name", order: "asc" },
      { field: "order_index", order: "asc" },
    ],
  });
}
```

## Pre-built Hooks

Available in `@/lib/refine/services`:

```ts
import {
  useClassesAndSpecs, // Classes and specs with helpers
  useGlobalColors, // Global color constants
  useGlobalStrings, // Localized strings
  useSpellDescription, // Spell description rendering
} from "@/lib/refine/services";

// Classes and specs with utility functions
const {
  classes,
  specs,
  isLoading,
  getClassColor,
  getSpecLabel,
  getSpecIcon,
  getSpecIdsForClass,
} = useClassesAndSpecs();

// Global colors (variadic)
const [primaryColor, secondaryColor] = useGlobalColors("primary", "secondary");

// Global strings (variadic)
const [errorText, successText] = useGlobalStrings("ERROR", "SUCCESS");

// Spell description with cross-references
const { result, isLoading, error, spell } = useSpellDescription(spellId);
```

## What To Do When Data Is Missing

### Scenario 1: Field exists in table but not in type

→ Check `database.types.ts` is up to date (run `pnpm cli generate-schemas`)

### Scenario 2: Need data from a different table

→ Check if resource exists in `resources.ts`, add if needed

### Scenario 3: Need entirely new data type

→ ASK THE USER. They need to decide:

- Which Supabase table/view to use
- What schema (`game` vs `public`)
- Whether to add a new resource definition

### Scenario 4: Need data that might not be in database

→ ASK THE USER. Don't guess. Don't hardcode.

## NEVER DO THIS

```tsx
// WRONG - Hardcoded game data
const SPELL_SCHOOLS = { 1: "Physical", 2: "Holy", 4: "Fire" };
const CLASS_NAMES = ["Warrior", "Paladin", "Hunter"];

// WRONG - Direct Supabase query (use hooks)
const supabase = createClient();
const { data } = await supabase.from("spells").select("*");

// WRONG - Guessing spell data
const fireball = { id: 133, name: "Fireball", castTime: 2500 };
```

## ALWAYS DO THIS

```tsx
// RIGHT - Use resource hooks
const { data: spell } = useResource<Spell>({ ...spells, id: spellId });
const { data: items } = useResourceMany<Item>({ ...items, ids: itemIds });

// RIGHT - Use type aliases
import type { Spell, Item, Class } from "@/lib/supabase/types";

// RIGHT - If you need something that doesn't exist
// ASK: "I need X data. Which table has this?"
```

## Research - DO THIS BEFORE ASKING

**Use Supabase MCP to research before asking the user anything.**

```sql
-- Find tables in game schema
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'game';

-- Check column names
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'game' AND table_name = 'spells';

-- Query data
SELECT * FROM game.spells WHERE id = 12345;
```

## Resources Quick Reference

| Resource         | Schema | ID Column | Type         |
| ---------------- | ------ | --------- | ------------ |
| `spells`         | game   | id        | Spell        |
| `items`          | game   | id        | Item         |
| `classes`        | game   | id        | Class        |
| `specs`          | game   | id        | Spec         |
| `auras`          | game   | spell_id  | Aura         |
| `global_colors`  | game   | name      | GlobalColor  |
| `global_strings` | game   | tag       | GlobalString |
| `specs_traits`   | game   | spec_id   | SpecTraits   |
