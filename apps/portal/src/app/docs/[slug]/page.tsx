import { notFound } from "next/navigation";
import Link from "next/link";
import { PageLayout } from "@/components/page";
import { getDocMeta, getAllDocSlugs, docsIndex } from "@/lib/docs";
import { DocNav } from "@/components/docs/doc-nav";
import { FileText } from "lucide-react";

// All the docs <(o_o)>
import Overview from "@/content/00-overview.md";
import McpServer from "@/content/01-mcp-server.md";
import DataFlow from "@/content/02-data-flow.md";

const docs: Record<string, React.ComponentType> = {
  "00-overview": Overview,
  "01-mcp-server": McpServer,
  "02-data-flow": DataFlow,
};

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllDocSlugs().map((slug) => ({ slug }));
}

export default async function DocPage({ params }: Props) {
  const { slug } = await params;
  const meta = getDocMeta(slug);
  const Content = docs[slug];

  if (!meta || !Content) {
    notFound();
  }

  const currentIndex = docsIndex.findIndex((d) => d.slug === slug);
  const prev = currentIndex > 0 ? docsIndex[currentIndex - 1] : null;
  const next =
    currentIndex < docsIndex.length - 1 ? docsIndex[currentIndex + 1] : null;

  return (
    <PageLayout
      title={meta.title}
      description="Technical documentation"
      breadcrumbs={[
        { label: "Docs", href: "/docs" },
        { label: meta.title, href: `/docs/${slug}` },
      ]}
    >
      <div className="flex gap-8">
        <aside className="hidden lg:block w-56 shrink-0">
          <nav className="sticky top-20 space-y-1">
            {docsIndex.map((d) => (
              <Link
                key={d.slug}
                href={`/docs/${d.slug}`}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  d.slug === slug
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <FileText className="h-4 w-4" />
                {d.title}
              </Link>
            ))}
          </nav>
        </aside>

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
