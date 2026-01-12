import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";

const namespaces = ["common", "home"] as const;

async function loadMessages(locale: string) {
  const messages = await Promise.all(
    namespaces.map((ns) =>
      import(`../messages/${locale}/${ns}.json`).then((m) => m.default),
    ),
  );

  return Object.assign({}, ...messages);
}

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) ?? routing.defaultLocale;

  return {
    locale,
    messages: await loadMessages(locale),
    timeZone: "UTC",
  };
});
