# Phase 5: Portal Data Layer Migration

## Context

Migrate portal from Refine to TanStack Query + direct Supabase client. The streamlined `game` schema tables eliminate the need for Refine's abstraction layer.

## Prerequisites

- Flat tables exist in `game` schema: `spells`, `items`, `auras`, `specs`, `specs_traits`
- Database types generated at `src/lib/supabase/database.types.ts`

## Goals

1. Remove Refine (`@refinedev/*`) entirely
2. Replace with TanStack Query + Supabase client
3. Simplify hooks in `src/lib/state/`
4. Remove Effect-TS DBC layer (no longer needed)

## Part 1: Remove Refine

### Delete Files

```
src/lib/refine/access-control.ts
src/lib/refine/auth-provider.ts
src/lib/refine/data-provider.ts
src/lib/refine/index.ts
src/lib/refine/persister.ts
src/lib/refine/resources.ts
src/providers/refine-provider.tsx
```

### Delete DBC Layer (no longer needed)

```
src/lib/dbc/fetcher.ts
src/lib/dbc/layer.ts
src/lib/dbc/batcher.ts
src/lib/dbc/keys.ts
src/lib/dbc/index.ts
src/providers/dbc-provider.tsx
```

### Remove Dependencies

```bash
pnpm remove @refinedev/core @refinedev/nextjs-router @refinedev/supabase
```

## Part 2: New Provider Setup

### Query Provider

```typescript
// src/providers/query-provider.tsx
"use client";

import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { type ReactNode, useState } from "react";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
        staleTime: 1000 * 60 * 5, // 5 minutes
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  const [persister] = useState(() =>
    typeof window !== "undefined"
      ? createSyncStoragePersister({
          storage: window.localStorage,
          key: "wowlab-query-cache",
        })
      : null
  );

  if (!persister) {
    return <>{children}</>;
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
```

### Update App Providers

```typescript
// src/providers/app-providers.tsx
import { QueryProvider } from "./query-provider";
// Remove: RefineProvider import

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      {children}
    </QueryProvider>
  );
}
```

## Part 3: Supabase Types

```typescript
// src/lib/supabase/types.ts
import type { Database } from "./database.types";

// Existing types (keep)
export type Row<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Insert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Update<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Game schema types (add)
export type GameRow<T extends keyof Database["game"]["Tables"]> =
  Database["game"]["Tables"][T]["Row"];

export type Spell = GameRow<"spells">;
export type Item = GameRow<"items">;
export type Aura = GameRow<"auras">;
export type Spec = GameRow<"specs">;
export type SpecTraits = GameRow<"specs_traits">;

// Summary types for lists/search
export interface SpellSummary {
  id: number;
  name: string;
  file_name: string;
}

export interface ItemSummary {
  id: number;
  name: string;
  item_level: number;
  quality: number;
  file_name: string;
}

export interface SpecSummary {
  id: number;
  name: string;
  class_name: string;
  class_id: number;
  icon_file_id: number;
}
```

## Part 4: Game Data Hooks

```typescript
// src/lib/state/game.ts
"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase";
import type {
  Aura,
  Item,
  ItemSummary,
  Spec,
  SpecSummary,
  SpecTraits,
  Spell,
  SpellSummary,
} from "@/lib/supabase/types";

// --- Spells ---

export function useSpell(id: number | null | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["game", "spell", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spells")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Spell;
    },
    enabled: id != null,
  });
}

export function useSpells(ids: number[]) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["game", "spells", ids],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spells")
        .select("*")
        .in("id", ids);
      if (error) throw error;
      return (data ?? []) as Spell[];
    },
    enabled: ids.length > 0,
  });
}

export function useSpellSearch(query: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["game", "spell-search", query],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spells")
        .select("id, name, file_name")
        .ilike("name", `%${query}%`)
        .limit(20);
      if (error) throw error;
      return (data ?? []) as SpellSummary[];
    },
    enabled: query.length > 2,
  });
}

// --- Items ---

export function useItem(id: number | null | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["game", "item", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Item;
    },
    enabled: id != null,
  });
}

export function useItems(ids: number[]) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["game", "items", ids],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .in("id", ids);
      if (error) throw error;
      return (data ?? []) as Item[];
    },
    enabled: ids.length > 0,
  });
}

export function useItemSearch(query: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["game", "item-search", query],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("items")
        .select("id, name, item_level, quality, file_name")
        .ilike("name", `%${query}%`)
        .limit(20);
      if (error) throw error;
      return (data ?? []) as ItemSummary[];
    },
    enabled: query.length > 2,
  });
}

// --- Auras ---

export function useAura(spellId: number | null | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["game", "aura", spellId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auras")
        .select("*")
        .eq("spell_id", spellId!)
        .single();
      if (error) throw error;
      return data as Aura;
    },
    enabled: spellId != null,
  });
}

// --- Specs ---

export function useSpec(id: number | null | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["game", "spec", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("specs")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Spec;
    },
    enabled: id != null,
  });
}

export function useSpecs() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["game", "specs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("specs")
        .select("id, name, class_name, class_id, icon_file_id")
        .order("class_name")
        .order("order_index");
      if (error) throw error;
      return (data ?? []) as SpecSummary[];
    },
  });
}

export function useSpecsByClass(classId: number) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["game", "specs", "class", classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("specs")
        .select("*")
        .eq("class_id", classId)
        .order("order_index");
      if (error) throw error;
      return (data ?? []) as Spec[];
    },
  });
}

export function useSpecTraits(specId: number | null | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["game", "spec-traits", specId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("specs_traits")
        .select("*")
        .eq("spec_id", specId!)
        .single();
      if (error) throw error;
      return data as SpecTraits;
    },
    enabled: specId != null,
  });
}
```

## Part 5: Auth Hooks

```typescript
// src/lib/state/user.ts
"use client";

import type { OAuthResponse, User } from "@supabase/supabase-js";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";

import { createClient } from "@/lib/supabase";

export interface UserProfile {
  id: string;
  email: string | null;
  handle: string | null;
  avatarUrl: string | null;
}

export function useUser() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: async (): Promise<UserProfile | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("handle, avatar_url")
        .eq("id", user.id)
        .single();

      return {
        id: user.id,
        email: user.email ?? null,
        handle: profile?.handle ?? null,
        avatarUrl: profile?.avatar_url ?? null,
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
    });
    return () => subscription.unsubscribe();
  }, [supabase, queryClient]);

  const login = useCallback(
    (provider: "discord" | "github"): Promise<OAuthResponse> => {
      return supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    },
    [supabase],
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    queryClient.invalidateQueries({ queryKey: ["auth"] });
  }, [supabase, queryClient]);

  return {
    user: user ?? null,
    isLoading,
    isLoggedIn: !!user,
    login,
    logout,
  };
}
```

## Part 6: Rotation Hooks

```typescript
// src/lib/state/rotation.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase";
import type { Row, Insert, Update } from "@/lib/supabase/types";

type Rotation = Row<"rotations">;
type RotationInsert = Insert<"rotations">;
type RotationUpdate = Update<"rotations">;

export function useRotation(id: string | null | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["rotations", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rotations")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Rotation;
    },
    enabled: !!id,
  });
}

export function useRotations(options?: {
  specId?: number;
  userId?: string;
  isPublic?: boolean;
}) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["rotations", "list", options],
    queryFn: async () => {
      let query = supabase.from("rotations").select("*");

      if (options?.specId) query = query.eq("spec_id", options.specId);
      if (options?.userId) query = query.eq("user_id", options.userId);
      if (options?.isPublic !== undefined) query = query.eq("is_public", options.isPublic);

      const { data, error } = await query.order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Rotation[];
    },
  });
}

export function useCreateRotation() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (values: RotationInsert) => {
      const { data, error } = await supabase
        .from("rotations")
        .insert(values)
        .select()
        .single();
      if (error) throw error;
      return data as Rotation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["rotations"] });
      router.push(`/rotations/editor/${data.id}`);
    },
  });
}

export function useUpdateRotation() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...values }: RotationUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("rotations")
        .update(values)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Rotation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["rotations"] });
      queryClient.setQueryData(["rotations", data.id], data);
    },
  });
}

export function useDeleteRotation() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rotations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rotations"] });
    },
  });
}
```

## Part 7: Update Exports

```typescript
// src/lib/state/index.ts
export {
  useAura,
  useItem,
  useItems,
  useItemSearch,
  useSpec,
  useSpecs,
  useSpecsByClass,
  useSpecTraits,
  useSpell,
  useSpells,
  useSpellSearch,
} from "./game";

export {
  useCreateRotation,
  useDeleteRotation,
  useRotation,
  useRotations,
  useUpdateRotation,
} from "./rotation";

export { useUser, type UserProfile } from "./user";

export { useCardExpanded, useSidebar } from "./ui";
export { useEditor, useDefaultList, useListsByType, useSelectedList } from "./editor";
```

## Checklist

### Remove
- [ ] Delete `src/lib/refine/` directory (6 files)
- [ ] Delete `src/providers/refine-provider.tsx`
- [ ] Delete `src/lib/dbc/` directory (5 files)
- [ ] Delete `src/providers/dbc-provider.tsx`
- [ ] Remove `@refinedev/*` dependencies
- [ ] Remove unused imports from components

### Create
- [ ] Create `src/providers/query-provider.tsx`
- [ ] Update `src/providers/app-providers.tsx`

### Update
- [ ] Update `src/lib/supabase/types.ts` with game types
- [ ] Rewrite `src/lib/state/game.ts` (new file, replaces dbc.ts + game-data-search.ts)
- [ ] Rewrite `src/lib/state/user.ts`
- [ ] Rewrite `src/lib/state/rotation.ts`
- [ ] Rewrite `src/lib/state/profile.ts` (if still needed)
- [ ] Update `src/lib/state/index.ts` exports
- [ ] Update components using old hooks

### Verify
- [ ] `pnpm build` succeeds
- [ ] Auth flow works (login/logout)
- [ ] Game data queries work
- [ ] Rotation CRUD works
- [ ] Search works

## Success Criteria

1. No `@refinedev/*` imports anywhere
2. No `src/lib/refine/` or `src/lib/dbc/` directories
3. All hooks use TanStack Query + Supabase directly
4. `pnpm build` succeeds
5. All existing functionality preserved
