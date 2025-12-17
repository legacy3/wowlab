import { compareDesc, parseISO } from "date-fns";
import type { BlogEntry, BlogPost } from "./types";
import type { NavItem } from "@/lib/content/types";
import { blogPostEntries } from "./posts";
import { createNavItem } from "@/lib/content";

export const blogPosts: Record<string, BlogPost> = {};
export const blogIndex: BlogEntry[] = [];

for (const [slug, post] of blogPostEntries) {
  blogPosts[slug] = post;
  blogIndex.push({
    slug,
    ...post.meta,
    tableOfContents: post.tableOfContents,
    readingTime: post.readingTime,
  });
}

blogIndex.sort((a, b) =>
  compareDesc(parseISO(a.publishedAt), parseISO(b.publishedAt)),
);

export const blogSlugs = blogIndex.map((entry) => entry.slug);

export const blogTags = Array.from(
  new Set(blogIndex.flatMap((entry) => entry.tags ?? [])),
).sort();

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts[slug];
}

export function getBlogEntry(slug: string): BlogEntry | undefined {
  return blogIndex.find((entry) => entry.slug === slug);
}

export function filterPostsByTag(tag: string | null): BlogEntry[] {
  if (!tag) {
    return blogIndex;
  }

  return blogIndex.filter((entry) => entry.tags?.includes(tag));
}

export function getNavMeta(slug: string): NavItem {
  const post = blogPosts[slug];
  if (!post) {
    return null;
  }

  return createNavItem(slug, post.meta.title, "/blog");
}
