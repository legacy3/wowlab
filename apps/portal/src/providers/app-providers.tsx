"use client";

import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { QueryProvider } from "./query-provider";

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <NuqsAdapter>
      <ThemeProvider attribute="class">
        <QueryProvider>{children}</QueryProvider>
      </ThemeProvider>
    </NuqsAdapter>
  );
}
