import { cache } from "react";
import { notFound } from "next/navigation";

import { docSlugs, getDoc, getNavMeta } from "@/lib/docs";

export const getDocPageData = cache(async (slug: string[]) => {
  const fullSlug = slug.join("/");
  const doc = getDoc(fullSlug);

  if (!doc) {
    notFound();
  }

  const { default: Content, meta } = doc;

  const currentIndex = docSlugs.indexOf(fullSlug);
  const prev = currentIndex > 0 ? getNavMeta(docSlugs[currentIndex - 1]) : null;
  const next =
    currentIndex < docSlugs.length - 1
      ? getNavMeta(docSlugs[currentIndex + 1])
      : null;

  return { Content, meta, fullSlug, prev, next };
});
