"use client";

import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { RefineProvider } from "./refine-provider";

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <NuqsAdapter>
      <ThemeProvider attribute="class">
        <RefineProvider>{children}</RefineProvider>
      </ThemeProvider>
    </NuqsAdapter>
  );
}
