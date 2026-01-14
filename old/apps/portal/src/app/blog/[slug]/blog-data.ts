import { cache } from "react";
import { notFound } from "next/navigation";

import { blogSlugs, getBlogPost, getBlogEntry, getNavMeta } from "@/lib/blog";

export const getBlogPageData = cache(async (slug: string) => {
  const post = getBlogPost(slug);
  const entry = getBlogEntry(slug);

  if (!post || !entry) {
    notFound();
  }

  const { default: Content } = post;

  const currentIndex = blogSlugs.indexOf(slug);
  const prev =
    currentIndex > 0 ? getNavMeta(blogSlugs[currentIndex - 1]) : null;
  const next =
    currentIndex < blogSlugs.length - 1
      ? getNavMeta(blogSlugs[currentIndex + 1])
      : null;

  return { Content, entry, slug, prev, next };
});
