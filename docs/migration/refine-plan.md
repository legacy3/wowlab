# WowLab Portal Architecture

## Stack

| Layer       | Technology                           |
| ----------- | ------------------------------------ |
| Framework   | Next.js 16 App Router                |
| Data Layer  | Refine + @refinedev/supabase         |
| Auth        | Refine authProvider + Supabase OAuth |
| Caching     | TanStack Query + IndexedDB           |
| Spell Data  | Effect-TS + TanStack Query           |
| URL State   | nuqs                                 |
| Components  | shadcn/ui                            |

---

## File Structure

```
src/
├── app/                          # Next.js routes
│   ├── layout.tsx
│   ├── page.tsx
│   ├── rotations/
│   │   ├── page.tsx              # useList
│   │   ├── new/page.tsx          # useCreate
│   │   ├── editor/page.tsx       # useUpdate
│   │   └── [namespace]/
│   │       └── [slug]/page.tsx   # useOne
│   ├── users/
│   │   └── [handle]/page.tsx     # useOne
│   ├── account/
│   │   └── page.tsx              # useGetIdentity
│   └── auth/
│       └── callback/route.ts     # OAuth callback
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   └── database.types.ts     # Generated types
│   │
│   ├── refine/
│   │   ├── data-provider.ts      # Supabase data provider
│   │   ├── auth-provider.ts      # Supabase auth provider
│   │   ├── access-control.ts     # Permission checks
│   │   └── persister.ts          # IndexedDB persister
│   │
│   ├── config/
│   │   └── game.ts               # Patch version, expansion ID
│   │
│   └── services/
│       └── SupabaseDbcService.ts # Effect-TS spell data (unchanged)
│
├── providers/
│   ├── refine-provider.tsx       # Refine + TanStack Query + persistence
│   └── theme-provider.tsx        # Theme
│
├── queries/
│   ├── spells.ts                 # Spell query options (Effect-TS wrapped)
│   └── items.ts                  # Item query options
│
├── hooks/
│   ├── use-spell.ts              # useSpell, useSpellName, useSpellEffects
│   └── use-item.ts               # useItem, useItemSparse
│
└── components/                   # Pure UI components
    ├── layout/
    ├── rotations/
    ├── users/
    └── ui/
```

---

## Providers

### `src/providers/refine-provider.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/nextjs-router";
import { QueryClient } from "@tanstack/react-query";
import {
  persistQueryClientRestore,
  persistQueryClientSubscribe,
} from "@tanstack/react-query-persist-client";

import { createDataProvider } from "@/lib/refine/data-provider";
import { createAuthProvider } from "@/lib/refine/auth-provider";
import { createAccessControlProvider } from "@/lib/refine/access-control";
import { createPersister } from "@/lib/refine/persister";
import { GAME_CONFIG } from "@/lib/config/game";

const DAY = 1000 * 60 * 60 * 24;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 60 * DAY,
      staleTime: 30 * DAY,
      refetchOnWindowFocus: false,
    },
  },
});

const persister = createPersister();

export function RefineProvider({ children }: { children: React.ReactNode }) {
  const [isRestored, setIsRestored] = useState(false);
  const [dataProvider] = useState(createDataProvider);
  const [authProvider] = useState(createAuthProvider);
  const [accessControlProvider] = useState(createAccessControlProvider);

  useEffect(() => {
    persistQueryClientRestore({
      queryClient,
      persister,
      maxAge: 60 * DAY,
      buster: GAME_CONFIG.patchVersion,
    }).then(() => {
      setIsRestored(true);
      persistQueryClientSubscribe({
        queryClient,
        persister,
        buster: GAME_CONFIG.patchVersion,
        dehydrateOptions: {
          shouldDehydrateQuery: ({ state }) => state.status === "success",
        },
      });
    });
  }, []);

  if (!isRestored) return null;

  return (
    <Refine
      dataProvider={dataProvider}
      authProvider={authProvider}
      accessControlProvider={accessControlProvider}
      routerProvider={routerProvider}
      resources={[
        {
          name: "rotations",
          list: "/rotations",
          show: "/rotations/:namespace/:slug",
          create: "/rotations/new",
          edit: "/rotations/editor",
        },
        {
          name: "user_profiles",
          show: "/users/:handle",
        },
        {
          name: "user_preferences",
        },
        {
          name: "rotation_sim_results",
        },
      ]}
      options={{
        reactQuery: { clientConfig: queryClient },
        syncWithLocation: true,
      }}
    >
      {children}
    </Refine>
  );
}
```

---

## Refine Config

### `src/lib/refine/data-provider.ts`

```typescript
import { dataProvider } from "@refinedev/supabase";
import { createClient } from "@/lib/supabase/client";

export function createDataProvider() {
  return dataProvider(createClient());
}
```

### `src/lib/refine/auth-provider.ts`

```typescript
import type { AuthProvider } from "@refinedev/core";
import { createClient } from "@/lib/supabase/client";

export function createAuthProvider(): AuthProvider {
  const supabase = createClient();

  return {
    login: async ({ provider }: { provider: "discord" | "github" }) => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) return { success: false, error };
      return { success: true, redirectTo: data.url };
    },

    logout: async () => {
      await supabase.auth.signOut();
      return { success: true, redirectTo: "/" };
    },

    check: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session
        ? { authenticated: true }
        : { authenticated: false, redirectTo: "/" };
    },

    getIdentity: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      return { id: user.id, email: user.email, ...profile };
    },

    onError: async (error) => {
      if (error.status === 401) return { logout: true };
      return { error };
    },
  };
}
```

### `src/lib/refine/access-control.ts`

```typescript
import type { AccessControlProvider } from "@refinedev/core";
import { createClient } from "@/lib/supabase/client";

export function createAccessControlProvider(): AccessControlProvider {
  const supabase = createClient();

  return {
    can: async ({ resource, action, params }) => {
      // Read is always allowed (RLS handles visibility)
      if (action === "list" || action === "show") {
        return { can: true };
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { can: false, reason: "Not authenticated" };

      // Owner check for mutations
      if (resource === "rotations" && params?.id) {
        const { data } = await supabase
          .from("rotations")
          .select("user_id")
          .eq("id", params.id)
          .single();

        if (data?.user_id !== user.id) {
          return { can: false, reason: "Not owner" };
        }
      }

      return { can: true };
    },
  };
}
```

### `src/lib/refine/persister.ts`

```typescript
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
```

### `src/lib/config/game.ts`

```typescript
export const GAME_CONFIG = {
  patchVersion: "11.0.2",
  expansionId: 10,
  mythicPlusSeasonId: 13,
} as const;
```

---

## Spell Data (Effect-TS + TanStack Query)

### `src/queries/spells.ts`

```typescript
import { queryOptions } from "@tanstack/react-query";
import { Effect } from "effect";
import { DbcService } from "@wowlab/services/Data";
import { SupabaseDbcService } from "@/lib/services/SupabaseDbcService";
import { createClient } from "@/lib/supabase/client";

function runDbc<A>(effect: Effect.Effect<A, unknown, DbcService>): Promise<A> {
  const supabase = createClient();
  return Effect.runPromise(
    effect.pipe(Effect.provide(SupabaseDbcService(supabase))),
  );
}

export const spellQuery = (id: number) =>
  queryOptions({
    queryKey: ["spell", id],
    queryFn: () =>
      runDbc(DbcService.pipe(Effect.flatMap((d) => d.getSpell(id)))),
    staleTime: Infinity,
    gcTime: Infinity,
  });

export const spellNameQuery = (id: number) =>
  queryOptions({
    queryKey: ["spell", id, "name"],
    queryFn: () =>
      runDbc(DbcService.pipe(Effect.flatMap((d) => d.getSpellName(id)))),
    staleTime: Infinity,
    gcTime: Infinity,
  });

export const spellEffectsQuery = (id: number) =>
  queryOptions({
    queryKey: ["spell", id, "effects"],
    queryFn: () =>
      runDbc(DbcService.pipe(Effect.flatMap((d) => d.getSpellEffects(id)))),
    staleTime: Infinity,
    gcTime: Infinity,
  });
```

### `src/hooks/use-spell.ts`

```typescript
import { useQuery } from "@tanstack/react-query";
import {
  spellQuery,
  spellNameQuery,
  spellEffectsQuery,
} from "@/queries/spells";

export const useSpell = (id: number) => useQuery(spellQuery(id));
export const useSpellName = (id: number) => useQuery(spellNameQuery(id));
export const useSpellEffects = (id: number) => useQuery(spellEffectsQuery(id));
```

---

## App Layout

### `src/app/layout.tsx`

```typescript
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { RefineProvider } from "@/providers/refine-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { SiteShell } from "@/components/layout";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <NuqsAdapter>
          <RefineProvider>
            <ThemeProvider>
              <SiteShell>{children}</SiteShell>
              <Toaster />
            </ThemeProvider>
          </RefineProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
```

---

## Page Examples

### `src/app/rotations/page.tsx`

```typescript
"use client";

import { useList } from "@refinedev/core";
import { RotationCard } from "@/components/rotations/rotation-card";

export default function RotationsPage() {
  const { data, isLoading } = useList({
    resource: "rotations",
    filters: [
      { field: "visibility", operator: "eq", value: "public" },
      { field: "deleted_at", operator: "null" },
    ],
    sorters: [{ field: "updated_at", order: "desc" }],
    pagination: { pageSize: 50 },
    meta: { select: "*, user_profiles(handle, avatar_url)" },
  });

  if (isLoading) return <RotationsSkeleton />;

  return (
    <div className="grid gap-4">
      {data?.data.map((rotation) => (
        <RotationCard key={rotation.id} rotation={rotation} />
      ))}
    </div>
  );
}
```

### `src/app/rotations/[namespace]/[slug]/page.tsx`

```typescript
"use client";

import { useOne } from "@refinedev/core";
import { useParams } from "next/navigation";
import { RotationDetail } from "@/components/rotations/rotation-detail";

export default function RotationPage() {
  const { namespace, slug } = useParams<{ namespace: string; slug: string }>();

  const { data, isLoading } = useOne({
    resource: "rotations",
    id: "", // Not used, we filter instead
    meta: {
      select: "*, user_profiles(handle, avatar_url)",
      filter: [
        { field: "namespace", operator: "eq", value: namespace },
        { field: "slug", operator: "eq", value: slug },
      ],
    },
  });

  if (isLoading) return <RotationDetailSkeleton />;

  return <RotationDetail rotation={data?.data} />;
}
```

### `src/app/rotations/new/page.tsx`

```typescript
"use client";

import { useCreate, useGetIdentity, useGo } from "@refinedev/core";
import { RotationForm } from "@/components/rotations/rotation-form";

export default function NewRotationPage() {
  const { data: identity } = useGetIdentity();
  const { mutate, isLoading } = useCreate();
  const go = useGo();

  const onSubmit = (values: RotationFormValues) => {
    mutate(
      {
        resource: "rotations",
        values: {
          ...values,
          user_id: identity.id,
          namespace: identity.handle,
        },
      },
      {
        onSuccess: ({ data }) => {
          go({ to: `/rotations/${data.namespace}/${data.slug}` });
        },
      }
    );
  };

  return <RotationForm onSubmit={onSubmit} isLoading={isLoading} />;
}
```

### `src/app/account/page.tsx`

```typescript
"use client";

import { useGetIdentity, useIsAuthenticated } from "@refinedev/core";
import { redirect } from "next/navigation";
import { AccountSettings } from "@/components/account/account-settings";

export default function AccountPage() {
  const { data: auth, isLoading: authLoading } = useIsAuthenticated();
  const { data: identity, isLoading: identityLoading } = useGetIdentity();

  if (authLoading || identityLoading) return <AccountSkeleton />;
  if (!auth?.authenticated) redirect("/");

  return <AccountSettings identity={identity} />;
}
```

---

## What Uses What

| Data            | Source                                                                 |
| --------------- | ---------------------------------------------------------------------- |
| Rotations CRUD  | Refine `useList`, `useOne`, `useCreate`, `useUpdate`, `useDelete`      |
| User profiles   | Refine `useOne`, `useUpdate`                                           |
| User prefs      | Refine `useOne`, `useUpdate` on `user_preferences`                     |
| Sim results     | Refine `useList`, `useCreate`                                          |
| Auth state      | Refine `useGetIdentity`, `useIsAuthenticated`, `useLogin`, `useLogout` |
| Spell/item data | TanStack Query via `useSpell`, `useItem` (Effect-TS backend)           |
| URL state       | nuqs (filters, pagination, shareable state)                            |
| Ephemeral UI    | React `useState`                                                       |

---

## Dependencies

```bash
pnpm add @refinedev/core @refinedev/supabase @refinedev/nextjs-router
pnpm add @tanstack/react-query-persist-client idb-keyval
pnpm remove jotai
```

---

## Files to Delete

```
src/atoms/                        # Entire directory (replaced by Refine + React state)
src/providers/jotai-provider.tsx
src/lib/auth/require-auth.ts
src/components/providers/auth-sync.tsx
```
