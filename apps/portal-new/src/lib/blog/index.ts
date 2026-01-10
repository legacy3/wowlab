import { compareDesc, parseISO } from "date-fns";

import type { NavItem } from "@/lib/content/types";

import { createNavItem } from "@/lib/content";

import type { BlogEntry, BlogPost } from "./types";

import { blogPostEntries } from "./posts";

export const blogPosts: Record<string, BlogPost> = {};
export const blogIndex: BlogEntry[] = [];

for (const [slug, post] of blogPostEntries) {
  blogPosts[slug] = post;
  blogIndex.push({
    slug,
    ...post.meta,
    readingTime: post.readingTime,
    tableOfContents: post.tableOfContents,
  });
}

blogIndex.sort((a, b) =>
  compareDesc(parseISO(a.publishedAt), parseISO(b.publishedAt)),
);

export const blogSlugs = blogIndex.map((entry) => entry.slug);

export function getBlogEntry(slug: string): BlogEntry | undefined {
  return blogIndex.find((entry) => entry.slug === slug);
}

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts[slug];
}

export function getNavMeta(slug: string): NavItem {
  const post = blogPosts[slug];
  if (!post) {
    return null;
  }

  return createNavItem(slug, post.meta.title, "/blog");
}
