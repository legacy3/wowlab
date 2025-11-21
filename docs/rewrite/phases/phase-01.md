# Phase 1: @wowlab/core Foundation

**Goal:** Create core package with schemas, domain entities, and basic types using internal/ structure.

## What to Build

### Package Structure

```
packages/
  wowlab-core/
    package.json
    tsconfig.json
    vite.config.ts
    src/
      index.ts              # export * as Schemas from "./Schemas.js"
      Schemas.ts            # export * from "./internal/schemas/index.js"
      Entities.ts           # export * from "./internal/entities/index.js"
      Events.ts             # export * from "./internal/events/index.js"
      Errors.ts             # export * from "./internal/errors/index.js"
      internal/
        schemas/
          index.ts          # Re-exports all schema files
          Branded.ts
          Spell.ts
          Item.ts
          Aura.ts
          Enums.ts
        entities/
          index.ts          # Re-exports all entity files
          Unit.ts
          Spell.ts
          Aura.ts
          GameState.ts
        events/
          index.ts
          Events.ts
        errors/
          index.ts
          Errors.ts
```

### Files to Create

**1. `packages/wowlab-core/package.json`**

```json
{
  "name": "@wowlab/core",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    "./package.json": "./package.json",
    ".": "./build/index.js",
    "./*": "./build/*.js",
    "./internal/*": null
  },
  "files": ["build"],
  "scripts": {
    "build": "vite build && tsc-alias -p tsconfig.json",
    "typecheck": "tsc --noEmit",
    "lint": "eslint ."
  },
  "dependencies": {
    "effect": "^3.19.4",
    "immutable": "^5.1.4"
  },
  "devDependencies": {
    "tsc-alias": "^1.8.16",
    "vite-plugin-dts": "^4.5.4"
  }
}
```

**2. `src/index.ts` (Main entry)**

```typescript
// Namespace exports following Effect pattern
export * as Schemas from "./Schemas.js";
export * as Entities from "./Entities.js";
export * as Events from "./Events.js";
export * as Errors from "./Errors.js";
```

**3. Barrel exports**

```typescript
// src/Schemas.ts
export * from "./internal/schemas/index.js";

// src/Entities.ts
export * from "./internal/entities/index.js";

// src/Events.ts
export * from "./internal/events/index.js";

// src/Errors.ts
export * from "./internal/errors/index.js";
```

**4. Internal namespace exports**

```typescript
// src/internal/schemas/index.ts
export * from "./Branded.js";
export * from "./Spell.js";
export * from "./Item.js";
export * from "./Aura.js";
export * from "./Enums.js";

// src/internal/entities/index.ts
export * from "./Unit.js";
export * from "./Spell.js";
export * from "./Aura.js";
export * from "./GameState.js";

// src/internal/events/index.ts
export * from "./Events.js";

// src/internal/errors/index.ts
export * from "./Errors.js";
```

**5. Copy content from old packages:**

- `@packages/innocent-schemas/src/*` → `internal/schemas/*`
- `@packages/innocent-domain/src/Entities.ts` → `internal/entities/*`
- `@packages/innocent-domain/src/Events.ts` → `internal/events/Events.ts`
- `@packages/innocent-domain/src/Errors.ts` → `internal/errors/Errors.ts`

## Import Pattern

**Old:**
```typescript
import * as Schemas from "@packages/innocent-schemas"
import * as Entities from "@packages/innocent-domain/Entities"
```

**New:**
```typescript
import * as Schemas from "@wowlab/core/Schemas"
import * as Entities from "@wowlab/core/Entities"

// Or use main entry
import { Schemas, Entities } from "@wowlab/core"
```

## How to Test

Run:
```bash
pnpm --filter @wowlab/core build
```

Should output clean build with no errors.

## Verification Criteria

- ✅ Package builds without errors
- ✅ `internal/*` is not exposed in exports
- ✅ Can import namespaces: `import * as Schemas from "@wowlab/core/Schemas"`
- ✅ Can import from main: `import { Schemas } from "@wowlab/core"`
- ✅ No circular dependencies

## Next Phase

Phase 2: Create service interfaces with internal/ structure
