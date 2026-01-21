"use client";

import { getLocalizedUrl } from "intlayer";
import { useLocale } from "next-intlayer";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";

/**
 * A wrapper around Next.js useRouter that automatically localizes URLs.
 * Use this instead of useRouter when you need programmatic navigation.
 */
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
