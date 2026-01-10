import { notFound } from "next/navigation";
import { cache } from "react";

import { getAdjacentItems } from "@/lib/content";
import { docSlugs, getDoc, getNavMeta } from "@/lib/docs";

export const getDocPageData = cache(async (slug: string[]) => {
  const fullSlug = slug.join("/");
  const doc = getDoc(fullSlug);

  if (!doc) {
    notFound();
  }

  const { default: Content, meta, tableOfContents } = doc;
  const { next, prev } = getAdjacentItems(docSlugs, fullSlug, getNavMeta);

  return { Content, fullSlug, meta, next, prev, tableOfContents };
});
