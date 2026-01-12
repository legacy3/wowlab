"use client";

import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "next-themes";

import { RefineProvider } from "./refine-provider";

type AppProvidersProps = {
  children: React.ReactNode;
  locale: string;
  messages: Record<string, unknown>;
};

export function AppProviders({
  children,
  locale,
  messages,
}: AppProvidersProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ThemeProvider attribute="class">
        <RefineProvider>{children}</RefineProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
