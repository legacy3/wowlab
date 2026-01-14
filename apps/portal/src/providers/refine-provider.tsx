"use client";

import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/nextjs-router";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { type ReactNode, Suspense, useState } from "react";

import {
  createAccessControlProvider,
  createAuthProvider,
  createDataProvider,
  createPersister,
  resources,
} from "@/lib/refine";

import { DbcProvider } from "./dbc-provider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: Infinity,
      refetchOnWindowFocus: false,
      retry: 3,
      staleTime: Infinity,
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
        buster: "11.2.5",
        dehydrateOptions: {
          shouldDehydrateQuery: (query) =>
            query.state.status === "success" && query.meta?.persist === true,
        },
        maxAge: 1000 * 60 * 60 * 24 * 7,
        persister,
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
            disableTelemetry: true,
            reactQuery: {
              clientConfig: queryClient,
            },
            syncWithLocation: true,
            warnWhenUnsavedChanges: true,
          }}
        >
          <DbcProvider>{children}</DbcProvider>
        </Refine>
      </Suspense>
    </PersistQueryClientProvider>
  );
}

export { queryClient };
