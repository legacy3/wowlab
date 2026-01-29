"use client";

import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/nextjs-router";
import { QueryClientProvider } from "@tanstack/react-query";

import { authProvider } from "@/lib/refine/auth-provider";
import { dataProvider } from "@/lib/refine/data-provider";
import { liveProvider } from "@/lib/refine/live-provider";
import { getQueryClient } from "@/lib/refine/query-client";
import { resources } from "@/lib/refine/resources";

export function RefineProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <Refine
        authProvider={authProvider}
        dataProvider={{ default: dataProvider }}
        liveProvider={liveProvider}
        options={{ disableTelemetry: true, liveMode: "off" }}
        resources={resources}
        routerProvider={routerProvider}
      >
        {children}
      </Refine>
    </QueryClientProvider>
  );
}
