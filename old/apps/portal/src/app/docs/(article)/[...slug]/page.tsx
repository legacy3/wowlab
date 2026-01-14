import { ContentArticle } from "@/components/content/content-article";
import { ContentNav } from "@/components/content/content-nav";
import { DocUpdatedAt } from "@/components/docs/doc-updated-at";
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

      <ContentArticle
        className="flex-1 min-w-0 max-w-3xl"
        afterContent={<DocUpdatedAt date={meta.updatedAt} />}
        footer={<ContentNav prev={prev} next={next} />}
      >
        <Content />
      </ContentArticle>
    </div>
  );
}
