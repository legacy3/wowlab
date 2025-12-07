"use client";

import { useState, Suspense, type ReactNode } from "react";
import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/nextjs-router";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";

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
        buster: GAME_CONFIG.patchVersion,
        dehydrateOptions: {
          shouldDehydrateQuery: ({ state }) => state.status === "success",
        },
      }}
    >
      <Suspense>
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
            {
              name: "fight_profiles",
              list: "/api/fight-profiles",
            },
            {
              name: "view_most_wanted_items",
            },
          ]}
          options={{
            syncWithLocation: true,
            warnWhenUnsavedChanges: true,
            disableTelemetry: true,
            reactQuery: {
              clientConfig: queryClient,
            },
          }}
        >
          {children}
        </Refine>
      </Suspense>
    </PersistQueryClientProvider>
  );
}

export { queryClient };
