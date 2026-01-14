import { env } from "@/lib/env";
import type { BlogEntry } from "@/lib/blog/types";

type BlogPostJsonLdProps = {
  entry: BlogEntry;
  slug: string;
};

export function BlogPostJsonLd({ entry, slug }: BlogPostJsonLdProps) {
  const url = `${env.APP_URL}/blog/${slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: entry.title,
    description: entry.description,
    author: {
      "@type": "Person",
      name: entry.author,
    },
    datePublished: entry.publishedAt,
    url,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    publisher: {
      "@type": "Organization",
      name: "WoW Lab",
      url: env.APP_URL,
    },
    ...(entry.tags && entry.tags.length > 0 && { keywords: entry.tags }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
