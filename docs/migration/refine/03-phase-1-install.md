# Phase 1: Install Dependencies and Create Base Files

## Prompt for Claude

```
I'm migrating to Refine for Supabase data management. Phase 0.1 (database) and 0.2 (seed) are complete.

**YOUR TASK**: Install dependencies and create the base configuration files. Do NOT delete any existing code yet.

## Step 1: Install Dependencies

Run in apps/portal directory:

cd apps/portal
pnpm add @refinedev/core @refinedev/supabase @refinedev/nextjs-router
pnpm add @tanstack/react-query-persist-client idb-keyval

Note: @tanstack/react-query is already installed (used by Effect-TS data layer).

## Step 2: Create Game Config

Create apps/portal/src/lib/config/game.ts:

export const GAME_CONFIG = {
  patchVersion: "11.0.2",
  expansionId: 10,
  mythicPlusSeasonId: 13,
} as const;

export type GameConfig = typeof GAME_CONFIG;

## Step 3: Create IndexedDB Persister

Create apps/portal/src/lib/refine/persister.ts:

import { get, set, del } from "idb-keyval";
import type {
  PersistedClient,
  Persister,
} from "@tanstack/react-query-persist-client";

/**
 * Creates an IndexedDB-backed persister for TanStack Query.
 * Data is cached in IndexedDB and survives browser restarts.
 */
export function createPersister(key: IDBValidKey = "wowlab-cache"): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      await set(key, client);
    },
    restoreClient: async () => {
      return await get<PersistedClient>(key);
    },
    removeClient: async () => {
      await del(key);
    },
  };
}

## Step 4: Create Placeholder Files

Create these files with TODO comments - they'll be implemented in Phase 2:

### apps/portal/src/lib/refine/data-provider.ts

// TODO: Implement in Phase 2
// Will wrap @refinedev/supabase dataProvider
export {};

### apps/portal/src/lib/refine/auth-provider.ts

// TODO: Implement in Phase 2
// Will create Refine authProvider for Supabase OAuth
export {};

### apps/portal/src/lib/refine/access-control.ts

// TODO: Implement in Phase 2
// Will create accessControlProvider for ownership checks
export {};

### apps/portal/src/lib/refine/index.ts

// Exports will be added in Phase 2
export { createPersister } from "./persister";

## Step 5: Verify TanStack Query Setup

Check the existing TanStack Query provider location. It's likely in one of:
- apps/portal/src/providers/query-provider.tsx
- apps/portal/src/app/providers.tsx
- apps/portal/src/app/layout.tsx

We need to know where the existing QueryClient is created so we can:
1. Share it with Refine (avoid duplicate clients)
2. Add IndexedDB persistence to it

Run this to find it:
grep -r "QueryClient" apps/portal/src/ --include="*.tsx" --include="*.ts"

Document the file location for Phase 2.

## Step 6: Verify

Run pnpm build to ensure no errors were introduced.
The app should still work exactly as before.
```

## Expected Outcome

- Dependencies installed
- Game config file created
- Persister utility created
- Placeholder files ready for Phase 2
- Existing QueryClient location documented

## Checklist

- [ ] Install @refinedev/core
- [ ] Install @refinedev/supabase
- [ ] Install @refinedev/nextjs-router
- [ ] Install @tanstack/react-query-persist-client
- [ ] Install idb-keyval
- [ ] Create lib/config/game.ts
- [ ] Create lib/refine/persister.ts
- [ ] Create lib/refine/data-provider.ts (placeholder)
- [ ] Create lib/refine/auth-provider.ts (placeholder)
- [ ] Create lib/refine/access-control.ts (placeholder)
- [ ] Create lib/refine/index.ts
- [ ] Find existing QueryClient location and document it
- [ ] Run pnpm build (should pass)
