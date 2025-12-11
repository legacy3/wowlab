import { notFound } from "next/navigation";
import { PageLayout } from "@/components/page";
import { getDocMeta, getAllDocSlugs } from "@/lib/docs";
import { DocNav } from "@/components/docs/doc-nav";
import { DocSidebar } from "@/components/docs/doc-sidebar";

import Overview from "@/content/00-overview.md";
import WritingRotations from "@/content/guides/00-writing-rotations.md";
import SpecCoverage from "@/content/guides/01-spec-coverage.md";
import Architecture from "@/content/reference/00-architecture.md";
import DataModel from "@/content/reference/01-data-model.md";
import McpServer from "@/content/reference/02-mcp-server.md";
import Contributing from "@/content/development/00-contributing.md";

const docs: Record<string, React.ComponentType> = {
  "00-overview": Overview,
  "guides/00-writing-rotations": WritingRotations,
  "guides/01-spec-coverage": SpecCoverage,
  "reference/00-architecture": Architecture,
  "reference/01-data-model": DataModel,
  "reference/02-mcp-server": McpServer,
  "development/00-contributing": Contributing,
};

type Props = {
  params: Promise<{ slug: string[] }>;
};

export function generateStaticParams() {
  return getAllDocSlugs().map((slug) => ({ slug: slug.split("/") }));
}

export default async function DocPage({ params }: Props) {
  const { slug } = await params;
  const fullSlug = slug.join("/");
  const meta = getDocMeta(fullSlug);
  const Content = docs[fullSlug];

  if (!meta || !Content) {
    notFound();
  }

  const allSlugs = getAllDocSlugs();
  const currentIndex = allSlugs.indexOf(fullSlug);
  const prevSlug = currentIndex > 0 ? allSlugs[currentIndex - 1] : null;
  const nextSlug =
    currentIndex < allSlugs.length - 1 ? allSlugs[currentIndex + 1] : null;

  const prev = prevSlug ? (getDocMeta(prevSlug) ?? null) : null;
  const next = nextSlug ? (getDocMeta(nextSlug) ?? null) : null;

  return (
    <PageLayout
      title={meta.title}
      description="Technical documentation"
      breadcrumbs={[
        { label: "Docs", href: "/docs" },
        { label: meta.title, href: `/docs/${fullSlug}` },
      ]}
    >
      <div className="flex gap-8">
        <DocSidebar currentSlug={fullSlug} />

        <article className="flex-1 min-w-0 max-w-3xl">
          <div className="prose prose-invert">
            <Content />
          </div>

          <DocNav prev={prev} next={next} />
        </article>
      </div>
    </PageLayout>
  );
}
