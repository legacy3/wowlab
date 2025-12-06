# Phase 2: Create Refine Providers

## Prompt for Claude

```
I'm migrating to Refine. Phase 1 (install) is complete.

**YOUR TASK**: Create the Refine data provider, auth provider, access control, and main provider wrapper.

## Step 1: Data Provider

Create apps/portal/src/lib/refine/data-provider.ts:

import { dataProvider } from "@refinedev/supabase";
import { createClient } from "@/lib/supabase/client";

export function createDataProvider() {
  return dataProvider(createClient());
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

## Step 3: Access Control

Create apps/portal/src/lib/refine/access-control.ts:

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

## Step 4: Main Provider

Create apps/portal/src/providers/refine-provider.tsx:

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
          name: "user_settings",
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

## Step 5: Add to Layout

Update apps/portal/src/app/layout.tsx to use RefineProvider:

import { RefineProvider } from "@/providers/refine-provider";

// Wrap children with RefineProvider (replace JotaiProvider if it still exists)

## Step 6: Export from index

Update apps/portal/src/lib/refine/index.ts:

export { createDataProvider } from "./data-provider";
export { createAuthProvider } from "./auth-provider";
export { createAccessControlProvider } from "./access-control";
export { createPersister } from "./persister";

## Verify

Run pnpm build - the app should load without errors (though features won't work yet).
```

## Expected Outcome

- Refine provider wrapping the app
- Data provider connected to Supabase
- Auth provider handling OAuth
- Access control checking ownership
- IndexedDB persistence working

## Checklist

- [ ] Create lib/refine/data-provider.ts
- [ ] Create lib/refine/auth-provider.ts
- [ ] Create lib/refine/access-control.ts
- [ ] Create providers/refine-provider.tsx
- [ ] Update lib/refine/index.ts with exports
- [ ] Add RefineProvider to app layout
- [ ] Run pnpm build
- [ ] Verify app loads in browser
