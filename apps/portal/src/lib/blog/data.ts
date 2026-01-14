import { notFound } from "next/navigation";
import { cache } from "react";

import { blogSlugs, getBlogEntry, getBlogPost, getNavMeta } from "@/lib/blog";
import { getAdjacentItems } from "@/lib/content";

export const getBlogPageData = cache(async (slug: string) => {
  const post = getBlogPost(slug);
  const entry = getBlogEntry(slug);

  if (!post || !entry) {
    notFound();
  }

  const { default: Content } = post;
  const { next, prev } = getAdjacentItems(blogSlugs, slug, getNavMeta);

  return { Content, entry, next, prev, slug };
});
