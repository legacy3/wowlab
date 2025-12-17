import { blogSlugs } from "@/lib/blog";
import { ContentArticle } from "@/components/content/content-article";
import { ContentNav } from "@/components/content/content-nav";
import { BlogSidebar } from "@/components/blog/blog-sidebar";
import { getBlogPageData } from "./blog-data";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return blogSlugs.map((slug) => ({ slug }));
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const { Content, entry, prev, next } = await getBlogPageData(slug);

  return (
    <div className="flex gap-12">
      <ContentArticle
        className="flex-1 min-w-0 max-w-3xl"
        footer={<ContentNav prev={prev} next={next} showSubtitle />}
      >
        <Content />
      </ContentArticle>

      <BlogSidebar entry={entry} />
    </div>
  );
}
