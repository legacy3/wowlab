# Phase 2: Create Refine Providers

## Prompt for Claude

```
I'm migrating to Refine. Phase 1 (install) is complete.

**YOUR TASK**: Create the Refine data provider, auth provider, access control, and main provider wrapper. Integrate with the existing TanStack Query setup.

## Important: Column Names

The database uses camelCase column names. Use these exactly:
- userId (not user_id)
- deletedAt (not deleted_at)
- rotationId (not rotation_id)
- createdAt, updatedAt, meanDps, etc.

## Step 1: Data Provider

Create apps/portal/src/lib/refine/data-provider.ts:

import { dataProvider as supabaseDataProvider } from "@refinedev/supabase";
import { createClient } from "@/lib/supabase/client";

// Singleton client to avoid creating multiple connections
let client: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (!client) {
    client = createClient();
  }
  return client;
}

export function createDataProvider() {
  return supabaseDataProvider(getClient());
}

## Step 2: Auth Provider

Create apps/portal/src/lib/refine/auth-provider.ts:

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
      if (error) {
        return { success: false, error };
      }
      // OAuth redirects, so we return the URL
      if (data.url) {
        window.location.href = data.url;
      }
      return { success: true };
    },

    logout: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { success: false, error };
      }
      return { success: true, redirectTo: "/" };
    },

    check: async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        return { authenticated: true };
      }
      return { authenticated: false, redirectTo: "/" };
    },

    getIdentity: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Fetch profile with handle and avatar
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("handle, avatarUrl, email")
        .eq("id", user.id)
        .single();

      return {
        id: user.id,
        email: user.email ?? profile?.email,
        handle: profile?.handle,
        avatarUrl: profile?.avatarUrl,
      };
    },

    onError: async (error) => {
      if (error.status === 401 || error.status === 403) {
        return { logout: true };
      }
      return { error };
    },
  };
}

## Step 3: Access Control

Create apps/portal/src/lib/refine/access-control.ts:

import type { AccessControlProvider } from "@refinedev/core";
import { createClient } from "@/lib/supabase/client";

export function createAccessControlProvider(): AccessControlProvider {
  const supabase = createClient();

  return {
    can: async ({ resource, action, params }) => {
      // Read actions are always allowed (RLS handles visibility)
      if (action === "list" || action === "show") {
        return { can: true };
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { can: false, reason: "Not authenticated" };
      }

      // Owner check for rotation mutations
      if (resource === "rotations" && params?.id) {
        const { data } = await supabase
          .from("rotations")
          .select("userId")  // camelCase!
          .eq("id", params.id)
          .single();

        if (data?.userId !== user.id) {
          return { can: false, reason: "Not owner" };
        }
      }

      // Owner check for user_settings mutations
      if (resource === "user_settings" && params?.id) {
        if (params.id !== user.id) {
          return { can: false, reason: "Not owner" };
        }
      }

      return { can: true };
    },
  };
}

## Step 4: Main Provider with Persistence

Create apps/portal/src/providers/refine-provider.tsx:

"use client";

import { useState, useEffect, type ReactNode } from "react";
import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/nextjs-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  PersistQueryClientProvider,
} from "@tanstack/react-query-persist-client";

import { createDataProvider } from "@/lib/refine/data-provider";
import { createAuthProvider } from "@/lib/refine/auth-provider";
import { createAccessControlProvider } from "@/lib/refine/access-control";
import { createPersister } from "@/lib/refine/persister";
import { GAME_CONFIG } from "@/lib/config/game";

const DAY = 1000 * 60 * 60 * 24;

// Single shared QueryClient for both Effect-TS and Refine
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 60 * DAY,        // Keep in cache for 60 days
      staleTime: 30 * DAY,     // Consider fresh for 30 days
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const persister = createPersister("wowlab-refine-cache");

interface RefineProviderProps {
  children: ReactNode;
}

export function RefineProvider({ children }: RefineProviderProps) {
  const [dataProvider] = useState(createDataProvider);
  const [authProvider] = useState(createAuthProvider);
  const [accessControlProvider] = useState(createAccessControlProvider);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 60 * DAY,
        buster: GAME_CONFIG.patchVersion, // Invalidate cache on patch change
        dehydrateOptions: {
          shouldDehydrateQuery: ({ state }) => state.status === "success",
        },
      }}
    >
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
            name: "user_settings",
            // No routes - accessed via useOne with user ID
          },
          {
            name: "rotation_sim_results",
            // No routes - accessed via useList with rotation ID
          },
          {
            name: "fight_profiles",
            list: "/api/fight-profiles", // Reference data
          },
          {
            name: "most_wanted_items",
            // Materialized view - read only
          },
        ]}
        options={{
          syncWithLocation: true,
          warnWhenUnsavedChanges: true,
        }}
      >
        {children}
      </Refine>
    </PersistQueryClientProvider>
  );
}

// Export queryClient for use elsewhere if needed
export { queryClient };

## Step 5: Update Exports

Update apps/portal/src/lib/refine/index.ts:

export { createDataProvider } from "./data-provider";
export { createAuthProvider } from "./auth-provider";
export { createAccessControlProvider } from "./access-control";
export { createPersister } from "./persister";

## Step 6: Add to Layout

Update apps/portal/src/app/layout.tsx to include RefineProvider.

Find the existing providers (likely ThemeProvider, JotaiProvider) and add RefineProvider:

import { RefineProvider } from "@/providers/refine-provider";

// In the layout, wrap with RefineProvider
// Keep JotaiProvider for UI atoms - it's still needed!

<ThemeProvider>
  <JotaiProvider>  {/* KEEP THIS - needed for UI atoms */}
    <RefineProvider>
      {children}
    </RefineProvider>
  </JotaiProvider>
</ThemeProvider>

## Step 7: Handle Existing QueryClient (if any)

If there's already a QueryClientProvider for Effect-TS data:
1. Remove the old QueryClientProvider
2. Use the one from RefineProvider (PersistQueryClientProvider)
3. Effect-TS queries will automatically use the shared client

Check for existing QueryClient usage:
grep -r "QueryClientProvider" apps/portal/src/

If found, merge into RefineProvider setup.

## Verify

1. Run pnpm build
2. Check app loads in browser (should work exactly as before)
3. Check browser DevTools > Application > IndexedDB for "wowlab-refine-cache"
```

## Expected Outcome

- Refine provider wrapping the app
- Data provider connected to Supabase
- Auth provider handling OAuth
- Access control checking ownership
- IndexedDB persistence working
- JotaiProvider still present for UI atoms

## Checklist

- [ ] Create lib/refine/data-provider.ts
- [ ] Create lib/refine/auth-provider.ts (with camelCase column names)
- [ ] Create lib/refine/access-control.ts (with camelCase column names)
- [ ] Create providers/refine-provider.tsx with PersistQueryClientProvider
- [ ] Update lib/refine/index.ts with exports
- [ ] Add RefineProvider to app layout (keep JotaiProvider!)
- [ ] Merge/remove any existing QueryClientProvider
- [ ] Run pnpm build
- [ ] Verify app loads in browser
- [ ] Verify IndexedDB cache is created
