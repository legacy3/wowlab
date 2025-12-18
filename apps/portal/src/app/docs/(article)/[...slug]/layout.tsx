import type { Metadata } from "next";
import { PageLayout } from "@/components/page";
import { env } from "@/lib/env";
import { getDocPageData } from "./doc-data";

type Props = {
  children: React.ReactNode;
  params: Promise<{ slug: string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { meta, fullSlug } = await getDocPageData(slug);

  const url = `${env.APP_URL}/docs/${fullSlug}`;

  return {
    title: `${meta.title} | WoW Lab Docs`,
    description: meta.description ?? "Technical documentation for WoW Lab",
    openGraph: {
      type: "article",
      title: meta.title,
      description: meta.description ?? "Technical documentation for WoW Lab",
      url,
      siteName: "WoW Lab",
      images: [`${env.APP_URL}/docs/opengraph-image`], // doesn't cascade into catch-all routes
    },
    twitter: {
      card: "summary_large_image",
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function DocLayout({ children, params }: Props) {
  const { slug } = await params;
  const { meta } = await getDocPageData(slug);

  return (
    <PageLayout
      title={meta.title}
      description={meta.description ?? "Technical documentation"}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Docs", href: "/docs" },
        { label: meta.title },
      ]}
    >
      {children}
    </PageLayout>
  );
}
