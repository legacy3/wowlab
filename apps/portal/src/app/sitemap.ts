import type { MetadataRoute } from "next";
import { blogIndex } from "@/lib/blog";
import { docSlugs } from "@/lib/docs";
import { env } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = env.APP_URL;

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/docs`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/simulate`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/rotations`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/talents`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/optimize`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/rankings`,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/lab`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/lab/spec-coverage`,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/lab/inspector/search`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const blogPages: MetadataRoute.Sitemap = blogIndex.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.publishedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const docPages: MetadataRoute.Sitemap = docSlugs.map((slug) => ({
    url: `${baseUrl}/docs/${slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticPages, ...blogPages, ...docPages];
}
