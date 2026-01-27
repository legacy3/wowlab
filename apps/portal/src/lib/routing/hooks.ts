"use client";

import { getLocalizedUrl } from "intlayer";
import { useLocale } from "next-intlayer";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";

export function useLocalizedRouter() {
  const router = useRouter();
  const { locale } = useLocale();

  const push = useCallback(
    (url: string) => {
      router.push(getLocalizedUrl(url, locale));
    },
    [router, locale],
  );

  const replace = useCallback(
    (url: string) => {
      router.replace(getLocalizedUrl(url, locale));
    },
    [router, locale],
  );

  return useMemo(
    () => ({
      ...router,
      push,
      replace,
    }),
    [router, push, replace],
  );
}
