# wowlab-specs

Class and specialization definitions with spell constants and modifiers.

Note: The Rust simulation engine (`crates/engine/`) uses TOML spec configurations in `crates/engine/specs/`. This TypeScript package defines the TypeScript-side spec structure.

## Structure

```
src/
  Hunter.ts          # Re-exports from internal/hunter/
  Shared.ts          # Re-exports from internal/shared/
  internal/
    hunter/
      index.ts           # Hunter class definition
      beast-mastery.ts   # BM spec definition
      constants.ts       # Spell ID constants
    shared/
      types.ts           # ClassDefinition, SpecDefinition types
```

## Adding a New Spec

1. Create folder: `internal/{class}/`
2. Define constants: spell IDs, aura IDs
3. Define spec: implements `SpecDefinition` type
4. Export from class file (e.g., `Hunter.ts`)

## Class Definition Pattern

```ts
import type { ClassDefinition } from "../shared/types.js";

export const Hunter: ClassDefinition = {
  id: "hunter",
  name: "Hunter",
  specs: [BeastMastery], // Add specs as implemented
};
```

## Spell Constants

Group by spec, use descriptive names:

```ts
export const BMSpells = {
  KILL_COMMAND: 34026,
  BARBED_SHOT: 217200,
  BESTIAL_WRATH: 19574,
} as const;
```

## Key Conventions

- Spell IDs from game data (wowhead, wowlab MCP)
- Constants are `as const` for literal types
- One file per spec, shared types in `shared/`
