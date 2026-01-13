import { defineRouting } from "next-intl/routing";

/* eslint-disable perfectionist/sort-objects */
export const locales = {
  en: "English",
  de: "Deutsch",
} as const;

export const routing = defineRouting({
  defaultLocale: "en",
  localePrefix: "as-needed",
  locales: Object.keys(locales) as (keyof typeof locales)[],
});

export type Locale = keyof typeof locales;
