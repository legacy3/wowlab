"use client";

import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "next-themes";

import { QueryProvider } from "./query-provider";

type AppProvidersProps = {
  children: React.ReactNode;
  locale: string;
  messages: Record<string, unknown>;
  timeZone: string;
};

export function AppProviders({
  children,
  locale,
  messages,
  timeZone,
}: AppProvidersProps) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone={timeZone}
    >
      <ThemeProvider attribute="class">
        <QueryProvider>{children}</QueryProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
