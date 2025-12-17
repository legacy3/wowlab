import { DocArticle } from "@/components/docs";
import { DocNav } from "@/components/docs/doc-nav";
import { DocSidebar } from "@/components/docs/doc-sidebar";
import { docSlugs } from "@/lib/docs";
import { getDocPageData } from "./doc-data";

type Props = {
  params: Promise<{ slug: string[] }>;
};

export function generateStaticParams() {
  return docSlugs.map((slug) => ({ slug: slug.split("/") }));
}

export default async function DocPage({ params }: Props) {
  const { slug } = await params;
  const { Content, meta, fullSlug, prev, next } = await getDocPageData(slug);

  return (
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
  );
}
