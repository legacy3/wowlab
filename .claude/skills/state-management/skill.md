---
name: state-management
description: Portal state architecture - React Query, Zustand, domain modules. Use when adding state, hooks, or data fetching.
---

# State Management - READ THIS FIRST

## The Rules

1. **All data state lives in `lib/state/{domain}/`** - Never in `hooks/`
2. **Server data uses React Query** - Caching, stale time, invalidation
3. **Client-only state uses Zustand** - Selection, UI, editor state
4. **Use DB types directly** - No duplicate type definitions
5. **`hooks/` is ONLY for pure utilities** - No data, no state

## Directory Structure

```
lib/state/
  index.ts              # Re-exports all domain hooks

  nodes/                # Domain module
    index.ts            # Public API
    queries.ts          # React Query hooks (useNodes, useNode)
    mutations.ts        # React Query mutations (useSaveNode, useClaimNode)
    store.ts            # Zustand store (selection state)
    types.ts            # UI-only types (derived, enums, options)

  editor/               # Rotation editor domain
    index.ts
    store.ts            # Zustand with Immer
    queries.ts          # useLoadRotation
    mutations.ts        # useSaveRotation

  game/                 # Game data domain
    index.ts
    queries.ts          # useSpell, useItem, useClasses, etc.

  user/                 # Auth domain
    index.ts
    queries.ts          # useUser, useUserProfile

  computing/            # Jobs/simulation domain
    index.ts
    store.ts            # Job history, worker metrics

  ui/                   # UI preferences
    index.ts
    store.ts            # Sidebar, card expansion

hooks/                  # ONLY pure utilities
  index.ts
  use-detected-platform.ts    # Browser platform detection
  use-active-heading.ts       # IntersectionObserver for TOC
```

## Type Strategy

### Use Database Types Directly

```ts
// database.types.ts provides everything
import type { Tables, TablesInsert, TablesUpdate } from "@/lib/supabase/database.types";

// Row type (for reading)
type NodeRow = Tables<"nodes">;
type NodePermissionRow = Tables<"nodes_permissions">;

// Insert type (for creating)
type NodeInsert = TablesInsert<"nodes">;

// Update type (for patching)
type NodeUpdate = TablesUpdate<"nodes">;
```

### UI-Only Types Go in `types.ts`

Only define types that don't exist in the database:

```ts
// lib/state/nodes/types.ts

// Derived/computed types
export type NodeOwner = "me" | "shared";

// UI enums not in DB
export type NodeAccessType = "private" | "friends" | "guild" | "public";

// Options for UI components
export const NODE_ACCESS_OPTIONS = [
  { value: "private", label: "Private" },
  { value: "friends", label: "Friends" },
  { value: "guild", label: "Guild" },
  { value: "public", label: "Public" },
] as const;

// Mapping functions (DB value <-> UI value)
export function mapAccessTypeFromDb(dbValue: string): NodeAccessType {
  switch (dbValue) {
    case "owner": return "private";
    case "user": return "friends";
    case "guild": return "guild";
    case "public": return "public";
    default: return "private";
  }
}
```

### NEVER Duplicate DB Types

```ts
// WRONG - Duplicating what database.types.ts already has
interface DbNode {
  id: string;
  name: string;
  user_id: string | null;
  // ... duplicating the schema
}

// RIGHT - Import from database.types.ts
import type { Tables } from "@/lib/supabase/database.types";
type NodeRow = Tables<"nodes">;
```

## React Query Patterns

### Queries (`queries.ts`)

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/client";

type NodeRow = Tables<"nodes">;

export function useNodes(userId: string | undefined) {
  return useQuery({
    queryKey: ["nodes", { userId }],
    queryFn: async () => {
      if (!userId) return { myNodes: [], sharedNodes: [] };

      const supabase = createClient();

      const { data: myNodes } = await supabase
        .from("nodes")
        .select("*")
        .eq("user_id", userId);

      const { data: sharedNodes } = await supabase
        .from("nodes")
        .select("*, nodes_permissions!inner(*)")
        .neq("user_id", userId)
        .eq("nodes_permissions.access_type", "public");

      return {
        myNodes: myNodes ?? [],
        sharedNodes: sharedNodes ?? [],
      };
    },
    enabled: !!userId,
  });
}

export function useNode(nodeId: string | undefined) {
  return useQuery({
    queryKey: ["nodes", nodeId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("nodes")
        .select("*, nodes_permissions(*)")
        .eq("id", nodeId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!nodeId,
  });
}
```

### Mutations (`mutations.ts`)

```ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TablesUpdate } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/client";

export function useNodeMutations() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  const updateNode = useMutation({
    mutationFn: async ({
      nodeId,
      data
    }: {
      nodeId: string;
      data: TablesUpdate<"nodes">
    }) => {
      const { error } = await supabase
        .from("nodes")
        .update(data)
        .eq("id", nodeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nodes"] });
    },
  });

  const deleteNode = useMutation({
    mutationFn: async (nodeId: string) => {
      const { error } = await supabase
        .from("nodes")
        .delete()
        .eq("id", nodeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nodes"] });
    },
  });

  return { updateNode, deleteNode };
}

export function useClaimNode() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  const verifyCode = useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase
        .from("nodes")
        .select("id, name, platform, total_cores")
        .eq("claim_code", code.toUpperCase())
        .is("user_id", null)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const claimNode = useMutation({
    mutationFn: async ({
      nodeId,
      userId,
      name,
      maxParallel
    }: {
      nodeId: string;
      userId: string;
      name: string;
      maxParallel: number;
    }) => {
      const { error } = await supabase
        .from("nodes")
        .update({
          user_id: userId,
          name,
          max_parallel: maxParallel,
          claim_code: null,
        })
        .eq("id", nodeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nodes"] });
    },
  });

  return { verifyCode, claimNode };
}
```

## Zustand Patterns

### Client State Only (`store.ts`)

```ts
"use client";

import { create } from "zustand";

interface NodesSelectionStore {
  selectedIds: Set<string>;
  toggleSelected: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
}

export const useNodesSelection = create<NodesSelectionStore>()((set, get) => ({
  selectedIds: new Set(),

  toggleSelected: (id) => {
    const selected = new Set(get().selectedIds);
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    set({ selectedIds: selected });
  },

  selectAll: (ids) => set({ selectedIds: new Set(ids) }),

  clearSelection: () => set({ selectedIds: new Set() }),
}));
```

### When to Use Zustand vs React Query

| Data Type | Tool | Example |
|-----------|------|---------|
| Server data (fetched) | React Query | Node list, user profile, rotations |
| Selection state | Zustand | Selected node IDs, selected rows |
| Editor state | Zustand | Rotation being edited |
| UI preferences | Zustand + persist | Sidebar collapsed, theme |
| Operation progress | Local useState | isSaving, isDeleting |

## Domain Module Index

Each domain exports a clean public API:

```ts
// lib/state/nodes/index.ts
"use client";

// Queries
export { useNodes, useNode } from "./queries";

// Mutations
export { useNodeMutations, useClaimNode } from "./mutations";

// Store
export { useNodesSelection } from "./store";

// Types (UI-only, not DB types)
export type { NodeOwner, NodeAccessType } from "./types";
export { NODE_ACCESS_OPTIONS, mapAccessTypeFromDb, mapAccessTypeToDb } from "./types";
```

## Main Index Re-exports

```ts
// lib/state/index.ts
"use client";

// Nodes
export * from "./nodes";

// Editor
export * from "./editor";

// Game
export * from "./game";

// User
export * from "./user";

// Computing
export * from "./computing";

// UI
export * from "./ui";
```

## Usage in Components

```tsx
import { useNodes, useNodeMutations, useNodesSelection } from "@/lib/state";
import { useUser } from "@/lib/state";

export function NodesPage() {
  const { data: user } = useUser();

  // Server data via React Query
  const { data, isLoading } = useNodes(user?.id);

  // Mutations via React Query
  const { deleteNode } = useNodeMutations();

  // Selection via Zustand
  const { selectedIds, toggleSelected, clearSelection } = useNodesSelection();

  const handleDelete = (id: string) => {
    deleteNode.mutate(id);
    clearSelection();
  };

  // ...
}
```

## Pure Utility Hooks (hooks/)

Only non-data hooks belong in `hooks/`:

```ts
// hooks/use-detected-platform.ts
"use client";

import { useMemo } from "react";

export type Platform = "windows" | "macos" | "linux" | null;

export function useDetectedPlatform(): Platform {
  return useMemo(() => {
    if (typeof navigator === "undefined") return null;
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("win")) return "windows";
    if (ua.includes("mac")) return "macos";
    if (ua.includes("linux")) return "linux";
    return null;
  }, []);
}
```

## Migration Checklist

When adding a new domain:

1. Create `lib/state/{domain}/` folder
2. Add `queries.ts` for React Query hooks
3. Add `mutations.ts` for React Query mutations (if needed)
4. Add `store.ts` for Zustand (only if client state needed)
5. Add `types.ts` for UI-only types (only if needed)
6. Add `index.ts` exporting public API
7. Update `lib/state/index.ts` to re-export
8. Delete any related files in `hooks/` (they shouldn't exist)

## NEVER DO THIS

```ts
// WRONG - Data fetching in hooks/
// hooks/use-nodes-data.ts
export function useNodesData() { ... }

// WRONG - Duplicate DB types
interface DbNode { id: string; name: string; ... }

// WRONG - React Query state in Zustand
const useNodesStore = create((set) => ({
  myNodes: [],  // This should be React Query
  isLoading: true,  // This should be React Query
}));

// WRONG - Manual fetch + sync to store
useEffect(() => {
  fetch().then(data => setMyNodes(data));  // Use React Query instead
}, []);
```

## ALWAYS DO THIS

```ts
// RIGHT - Use database types
import type { Tables } from "@/lib/supabase/database.types";
type NodeRow = Tables<"nodes">;

// RIGHT - React Query for server data
const { data, isLoading } = useNodes(userId);

// RIGHT - Zustand for client-only state
const { selectedIds, toggleSelected } = useNodesSelection();

// RIGHT - Domain module structure
import { useNodes, useNodeMutations, useNodesSelection } from "@/lib/state/nodes";
```
