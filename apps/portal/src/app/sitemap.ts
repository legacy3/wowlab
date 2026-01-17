import type { MetadataRoute } from "next";

import { blogIndex } from "@/lib/content/blog";
import { docSlugs } from "@/lib/content/docs";
import { env } from "@/lib/env";
import { getSitemapRoutes, routes } from "@/lib/routing";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = env.APP_URL;

  const staticPages: MetadataRoute.Sitemap = getSitemapRoutes().map(
    (route) => ({
      changeFrequency: route.sitemap.changeFrequency,
      priority: route.sitemap.priority,
      url: `${baseUrl}${route.path}`,
    }),
  );

  const blogPages: MetadataRoute.Sitemap = blogIndex.map((post) => ({
    changeFrequency: "monthly",
    lastModified: post.publishedAt,
    priority: 0.7,
    url: `${baseUrl}${routes.blog.index.path}/${post.slug}`,
  }));

  const docPages: MetadataRoute.Sitemap = docSlugs.map((slug) => ({
    changeFrequency: "monthly",
    priority: 0.6,
    url: `${baseUrl}${routes.dev.docs.index.path}/${slug}`,
  }));

  return [...staticPages, ...blogPages, ...docPages];
}
