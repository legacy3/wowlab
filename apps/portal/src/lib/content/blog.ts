import { type BlogPost, blog as veliteBlog } from "#content";
import { compareDesc } from "date-fns";
import { notFound } from "next/navigation";
import { cache } from "react";

import type { NavItem } from "./types";

import { createNavItem, getAdjacentItems } from "./utils";

export type { BlogPost } from "#content";

export const blogPosts: Record<string, BlogPost> = {};

for (const post of veliteBlog) {
  const slug = post.slug.replace(/^blog\//, "");
  blogPosts[slug] = post;
}

export const blogIndex: BlogPost[] = Object.values(blogPosts).sort((a, b) =>
  compareDesc(new Date(a.publishedAt), new Date(b.publishedAt)),
);

export const blogSlugs = blogIndex.map((post) =>
  post.slug.replace(/^blog\//, ""),
);

export function getBlogNavMeta(slug: string): NavItem {
  const post = blogPosts[slug];
  if (!post) {
    return null;
  }

  return createNavItem(slug, post.title, "/blog");
}

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts[slug];
}

export const getBlogPageData = cache(async (slug: string) => {
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const { next, prev } = getAdjacentItems(blogSlugs, slug, getBlogNavMeta);

  return {
    next,
    post,
    prev,
  };
});
