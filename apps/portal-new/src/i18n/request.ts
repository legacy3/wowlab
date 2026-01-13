import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";

type Messages = Record<string, string>;

function filterEmpty(obj: Messages): Messages {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== ""));
}

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) ?? routing.defaultLocale;

  // Always load default locale as base
  const defaultMessages: Messages = (
    await import(`./messages/${routing.defaultLocale}.po`)
  ).default;

  if (locale === routing.defaultLocale) {
    return { locale, messages: defaultMessages, timeZone: "UTC" };
  }

  const localeMessages: Messages = (await import(`./messages/${locale}.po`))
    .default;

  return {
    locale,
    messages: {
      ...defaultMessages,
      ...filterEmpty(localeMessages),
    },
    timeZone: "UTC",
  };
});
