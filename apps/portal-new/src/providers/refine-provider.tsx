"use client";

import { useState, Suspense, type ReactNode } from "react";
import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/nextjs-router";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import {
  createAccessControlProvider,
  createAuthProvider,
  createDataProvider,
  createPersister,
  resources,
} from "@/lib/refine";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: Infinity,
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      retry: 3,
    },
  },
});

const persister = createPersister("wowlab-cache");

export function RefineProvider({ children }: { children: ReactNode }) {
  const [dataProvider] = useState(createDataProvider);
  const [authProvider] = useState(createAuthProvider);
  const [accessControlProvider] = useState(createAccessControlProvider);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24 * 7,
        buster: "11.2", // TODO wire this up
        dehydrateOptions: {
          shouldDehydrateQuery: (query) =>
            query.state.status === "success" && query.meta?.persist === true,
        },
      }}
    >
      <Suspense>
        <Refine
          dataProvider={dataProvider}
          authProvider={authProvider}
          accessControlProvider={accessControlProvider}
          routerProvider={routerProvider}
          resources={resources}
          options={{
            syncWithLocation: true,
            warnWhenUnsavedChanges: true,
            disableTelemetry: true,
          }}
        >
          {children}
        </Refine>
      </Suspense>
    </PersistQueryClientProvider>
  );
}

export { queryClient };
