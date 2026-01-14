import type { Metadata } from "next";
import { PageLayout } from "@/components/page";
import { BlogPostJsonLd } from "@/components/blog/blog-json-ld";
import { env } from "@/lib/env";
import { getBlogPageData } from "./blog-data";

type Props = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { entry } = await getBlogPageData(slug);

  const url = `${env.APP_URL}/blog/${slug}`;

  return {
    title: `${entry.title} | WoW Lab Blog`,
    description: entry.description,
    authors: [{ name: entry.author }],
    openGraph: {
      type: "article",
      title: entry.title,
      description: entry.description,
      url,
      siteName: "WoW Lab",
      publishedTime: entry.publishedAt,
      authors: [entry.author],
      tags: entry.tags,
    },
    twitter: {
      card: "summary_large_image",
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function BlogPostLayout({ children, params }: Props) {
  const { slug } = await params;
  const { entry } = await getBlogPageData(slug);

  return (
    <PageLayout
      title={entry.title}
      description={entry.description}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Blog", href: "/blog" },
        { label: entry.title },
      ]}
    >
      <BlogPostJsonLd entry={entry} slug={slug} />
      {children}
    </PageLayout>
  );
}
