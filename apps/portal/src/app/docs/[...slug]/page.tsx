import { notFound } from "next/navigation";
import { PageLayout } from "@/components/page";
import { DocArticle } from "@/components/docs";
import { DocNav } from "@/components/docs/doc-nav";
import { DocSidebar } from "@/components/docs/doc-sidebar";
import { docSlugs, getDoc, getNavMeta } from "@/lib/docs";

type Props = {
  params: Promise<{ slug: string[] }>;
};

export function generateStaticParams() {
  return docSlugs.map((slug) => ({ slug: slug.split("/") }));
}

export default async function DocPage({ params }: Props) {
  const { slug } = await params;
  const fullSlug = slug.join("/");
  const doc = getDoc(fullSlug);

  if (!doc) {
    notFound();
  }

  const { default: Content, meta } = doc;

  const currentIndex = docSlugs.indexOf(fullSlug);
  const prev = currentIndex > 0 ? getNavMeta(docSlugs[currentIndex - 1]) : null;
  const next =
    currentIndex < docSlugs.length - 1
      ? getNavMeta(docSlugs[currentIndex + 1])
      : null;

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
      <div className="flex gap-8">
        <DocSidebar currentSlug={fullSlug} />

        <DocArticle
          className="flex-1 min-w-0"
          meta={meta}
          footer={<DocNav prev={prev} next={next} />}
        >
          <Content />
        </DocArticle>
      </div>
    </PageLayout>
  );
}
