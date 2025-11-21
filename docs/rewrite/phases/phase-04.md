# Phase 4: Metadata and SpellData Services

**Goal:** Implement metadata loading and spell data composition services with pluggable metadata.

## What to Build

### Add to Package Structure

```
packages/wowlab-services/src/internal/
  metadata/
    index.ts
    MetadataService.ts        # Interface (from Phase 2)
    InMemoryMetadata.ts       # Test implementation
    SupabaseMetadata.ts       # Production implementation
  data/
    index.ts
    SpellInfoService.ts       # Interface (from Phase 2)
    SpellInfoServiceLive.ts   # Implementation
  profile/
    index.ts
    ProfileComposer.ts        # Profile bundle composition
```

### Files to Create

**1. InMemoryMetadata (for testing)**

```typescript
// src/internal/metadata/InMemoryMetadata.ts
import * as Schemas from "@wowlab/core/Schemas";
import * as Errors from "@wowlab/core/Errors";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { Map as ImmutableMap } from "immutable";

import { MetadataService } from "./MetadataService.js";

export interface InMemoryMetadataConfig {
  readonly spells: ReadonlyArray<Schemas.Spell.SpellDataFlat>;
  readonly items: ReadonlyArray<Schemas.Item.ItemDataFlat>;
}

export const InMemoryMetadata = (config: InMemoryMetadataConfig) => {
  const spellMap = ImmutableMap(
    config.spells.map((spell) => [spell.id, spell]),
  );
  const itemMap = ImmutableMap(config.items.map((item) => [item.id, item]));

  return Layer.succeed(
    MetadataService,
    MetadataService.of({
      loadSpell: (spellId) => {
        const spell = spellMap.get(spellId);
        return spell
          ? Effect.succeed(spell)
          : Effect.fail(new Errors.SpellInfoNotFound({ spellId }));
      },
      loadItem: (itemId) => {
        const item = itemMap.get(itemId);
        return item
          ? Effect.succeed(item)
          : Effect.fail(new Errors.ItemNotFound({ itemId }));
      },
    }),
  );
};
```

**2. Update internal/metadata/index.ts**

```typescript
// src/internal/metadata/index.ts
export * from "./MetadataService.js";
export * from "./InMemoryMetadata.js";
// SupabaseMetadata will be added later when needed
```

**3. ProfileComposer**

```typescript
// src/internal/profile/ProfileComposer.ts
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Ref from "effect/Ref";
import * as Context from "effect/Context";

// Profile composition service
export class ProfileComposer extends Effect.Service<ProfileComposer>()(
  "ProfileComposer",
  {
    effect: Effect.gen(function* () {
      const cacheRef = yield* Ref.make(new Map<string, ComposedProfile>());

      const compose = (profileIds: ReadonlyArray<string>) =>
        Effect.gen(function* () {
          const signature = profileIds.join(",");
          const cache = yield* Ref.get(cacheRef);
          const cached = cache.get(signature);

          if (cached) return cached;

          // TODO: Load and compose profiles
          const composed = { signature, bundles: [] };

          yield* Ref.update(cacheRef, (prev) => {
            const next = new Map(prev);
            next.set(signature, composed);
            return next;
          });

          return composed;
        });

      return {
        compose,
      };
    }),
  },
) {}
```

**4. Update internal/profile/index.ts**

```typescript
// src/internal/profile/index.ts
export * from "./ProfileComposer.js";
```

**5. Add barrel exports**

```typescript
// src/Profile.ts
export * from "./internal/profile/index.js";
```

**6. Update main index.ts**

```typescript
// src/index.ts (add Profile export)
export * as Profile from "./Profile.js";
```

## How to Test in Standalone

**Create:** `apps/standalone/src/new/phase-04-test.ts`

```typescript
import * as Metadata from "@wowlab/services/Metadata";
import * as Schemas from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

const mockSpells: Schemas.Spell.SpellDataFlat[] = [
  {
    id: 108853,
    name: "Fire Blast",
    school: Schemas.Enums.SpellSchool.Fire,
    // ... other required fields
  } as any,
  {
    id: 2948,
    name: "Scorch",
    school: Schemas.Enums.SpellSchool.Fire,
    // ... other required fields
  } as any,
];

const testMetadata = Effect.gen(function* () {
  const metadata = yield* Metadata.MetadataService;

  // Load Fire Blast
  const fireBlast = yield* metadata.loadSpell(108853);
  console.log("Loaded spell:", fireBlast.name);

  // Load Scorch
  const scorch = yield* metadata.loadSpell(2948);
  console.log("Loaded spell:", scorch.name);

  // Test error handling
  const missing = yield* Effect.either(metadata.loadSpell(99999));
  if (missing._tag === "Left") {
    console.log("Error handled correctly:", missing.left);
  }

  return { success: true, spells: [fireBlast, scorch] };
});

const metadataLayer = Metadata.InMemoryMetadata({
  spells: mockSpells,
  items: [],
});

const main = async () => {
  const result = await Effect.runPromise(
    testMetadata.pipe(Effect.provide(metadataLayer)),
  );
  console.log("Result:", result);
};

main();
```

Run:

```bash
cd apps/standalone
pnpm tsx src/new/phase-04-test.ts
```

## Verification Criteria

- ✅ InMemoryMetadata loads mock spells correctly
- ✅ MetadataService returns correct spell data
- ✅ Error handling works (SpellInfoNotFound)
- ✅ Layer composition is clean (no @ts-ignore)
- ✅ Can swap metadata implementations easily
- ✅ Invariants enforced (see below)

## Data invariants to honor (document in code comments)

- `castTime === 0` implies `gcd <= 1500` and `isInstant = true` where applicable.
- `cooldown >= 0`; spells with `charges` must include `chargeCooldown`.
- Travel time fields are optional but, if present, must be non-negative.
- Items/spells must declare `school`, `resourceCost` brand consistent with schemas.
- MetadataService must only fail with domain errors from `@wowlab/core/Errors`.

## Next Phase

Phase 5: Business services (Unit, Spell, Lifecycle, Accessors)
