# Phase 1: Install Dependencies and Create Base Files

## Prompt for Claude

```
I'm migrating to Refine for Supabase data management. Phase 0 (deletion) is complete.

**YOUR TASK**: Install dependencies and create the base configuration files.

## Step 1: Install Dependencies

Run in apps/portal:

pnpm add @refinedev/core @refinedev/supabase @refinedev/nextjs-router
pnpm add @tanstack/react-query-persist-client idb-keyval

## Step 2: Create Game Config

Create apps/portal/src/lib/config/game.ts:

export const GAME_CONFIG = {
  patchVersion: "11.0.2",
  expansionId: 10,
  mythicPlusSeasonId: 13,
} as const;

## Step 3: Create IndexedDB Persister

Create apps/portal/src/lib/refine/persister.ts:

import { get, set, del } from "idb-keyval";
import type {
  PersistedClient,
  Persister,
} from "@tanstack/react-query-persist-client";

export function createPersister(key: IDBValidKey = "wowlab-cache"): Persister {
  return {
    persistClient: (client: PersistedClient) => set(key, client),
    restoreClient: () => get<PersistedClient>(key),
    removeClient: () => del(key),
  };
}

## Step 4: Create Placeholder Files

Create empty placeholder files that we'll fill in later phases:
- apps/portal/src/lib/refine/data-provider.ts
- apps/portal/src/lib/refine/auth-provider.ts
- apps/portal/src/lib/refine/access-control.ts
- apps/portal/src/lib/refine/index.ts

## Step 5: Verify

Run pnpm build to ensure no new errors were introduced.
```

## Expected Outcome

- Dependencies installed
- Game config file created
- Persister utility created
- Placeholder files ready for Phase 2

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
- [ ] Run pnpm build
