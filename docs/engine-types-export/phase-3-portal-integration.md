# Phase 3: Portal Integration - Use Engine Types

## Objective

Replace all manually-defined TypeScript types in the portal with generated types from the engine WASM module. **Engine is the source of truth** - existing portal types are deleted, not migrated.

## Prerequisites

- Phase 2 complete (engine WASM package built)
- `packages/engine-X.X.X.tgz` exists

## Portal Changes

### 1. Add Dependency

Update `apps/portal/package.json`:

```json
{
  "dependencies": {
    "engine": "file:../../packages/engine-X.X.X.tgz"
  }
}
```

Run: `pnpm install`

### 2. Create Engine Module

Create `apps/portal/src/lib/engine/index.ts`:

```typescript
"use client";

// Engine type re-exports
// All types come from Rust engine - single source of truth

export type {
  // Effect system
  SpellEffect,
  EffectCondition,
  ModCondition,
  DamageMod,

  // Spell definitions
  SpellDef,
  CastType,
  GcdType,
  SpellTarget,
  ResourceCost,
  DamageEffect,

  // Aura definitions
  AuraDef,
  AuraEffect,
  AuraFlags,
  PeriodicEffect,

  // Enums
  ResourceType,
  DamageSchool,
  Attribute,
  RatingType,

  // Schema
  ConditionFieldDef,
  FieldType,
} from "engine";

// Singleton WASM module
let engineModule: typeof import("engine") | null = null;
let initPromise: Promise<typeof import("engine")> | null = null;

/**
 * Initialize and get the engine WASM module.
 * Uses dynamic import to avoid SSR issues.
 */
export async function getEngine(): Promise<typeof import("engine")> {
  if (engineModule) return engineModule;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const mod = await import("engine");
    await mod.default(); // WASM init
    engineModule = mod;
    return mod;
  })();

  return initPromise;
}

// Re-export WASM functions with async wrapper
export async function getConditionSchema() {
  const engine = await getEngine();
  return engine.getConditionSchema();
}

export async function getResourceTypes() {
  const engine = await getEngine();
  return engine.getResourceTypes();
}

export async function getDamageSchools() {
  const engine = await getEngine();
  return engine.getDamageSchools();
}

export async function getEngineVersion() {
  const engine = await getEngine();
  return engine.getEngineVersion();
}
```

> **Important:** Use `"use client"` and dynamic imports. WASM cannot run during SSR.

### 3. Files to Delete

These files are replaced by engine-generated types:

| File | Lines | Replaced By |
|------|-------|-------------|
| `src/components/editor/types.ts` | 153 | Engine types |
| `src/components/editor/conditions/fields.ts` | 867 | `getConditionSchema()` |
| `src/components/editor/constants.ts` | 53 | Engine enums |

### 4. Update Editor Components

#### Condition Builder

```typescript
// apps/portal/src/components/editor/conditions/condition-builder.tsx
"use client";

import { useEffect, useState } from "react";
import { getConditionSchema, type ConditionFieldDef } from "@/lib/engine";

export function ConditionBuilder() {
  const [fields, setFields] = useState<ConditionFieldDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getConditionSchema()
      .then(setFields)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} />;

  return (
    <QueryBuilder
      fields={fields}
      // ... rest of component
    />
  );
}
```

#### Action Card

```typescript
// apps/portal/src/components/editor/actions/action-card.tsx
import type { SpellEffect, SpellDef } from "@/lib/engine";

interface ActionCardProps {
  effect: SpellEffect;
  spell?: SpellDef;
}
```

### 5. Update State Management

```typescript
// apps/portal/src/lib/state/editor.ts
import type { SpellEffect, EffectCondition, SpellDef, AuraDef } from "@/lib/engine";

// State uses engine types directly
interface EditorState {
  selectedSpell: SpellDef | null;
  effects: SpellEffect[];
  // ...
}
```

## Context Provider (Optional)

For cleaner initialization, use a React context:

```typescript
// apps/portal/src/lib/engine/provider.tsx
"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getEngine } from "./index";

type EngineModule = Awaited<ReturnType<typeof getEngine>>;

const EngineContext = createContext<EngineModule | null>(null);

export function EngineProvider({ children }: { children: ReactNode }) {
  const [engine, setEngine] = useState<EngineModule | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getEngine().then(setEngine).catch(setError);
  }, []);

  if (error) {
    return <div>Failed to load engine: {error.message}</div>;
  }

  if (!engine) {
    return <div>Loading engine...</div>;
  }

  return (
    <EngineContext.Provider value={engine}>
      {children}
    </EngineContext.Provider>
  );
}

export function useEngine() {
  const engine = useContext(EngineContext);
  if (!engine) {
    throw new Error("useEngine must be used within EngineProvider");
  }
  return engine;
}
```

Usage:
```typescript
// In layout.tsx
<EngineProvider>
  <RotationEditor />
</EngineProvider>

// In components
const engine = useEngine();
const schema = engine.getConditionSchema();
```

## Verification

1. **Type check**: `pnpm typecheck`
2. **Build**: `pnpm build`
3. **Runtime test**: Load editor, verify condition fields populate from WASM
4. **Console check**: No WASM-related errors

## Success Criteria

- [ ] Portal builds with engine dependency
- [ ] Editor loads condition schema from WASM
- [ ] No TypeScript errors
- [ ] Old type files deleted
- [ ] Loading states handle WASM initialization

---

## Prompt for Fresh Claude Instance

```
I'm working on Phase 3 of the engine-types-export plan for the wowlab project.

GOAL: Integrate engine WASM package into the portal, using engine-generated types.

CONTEXT:
- Phase 2 complete: packages/engine-X.X.X.tgz exists with all types
- Portal is at apps/portal/ (Next.js with App Router)
- Use dynamic imports for WASM (SSR uses async initialization)

TASKS:
1. Add engine to apps/portal/package.json as file: dependency
2. Create src/lib/engine/index.ts:
   - Type re-exports from engine
   - Singleton WASM initialization with dynamic import
   - Async wrapper functions for WASM calls
3. Delete old type files:
   - src/components/editor/types.ts
   - src/components/editor/conditions/fields.ts
   - src/components/editor/constants.ts
4. Update editor components to import from @/lib/engine
5. Add loading/error states for WASM initialization
6. Optionally create EngineProvider context for cleaner usage

Start by reading packages/engine-X.X.X.tgz contents (after Phase 2 build) to see available exports.
```
