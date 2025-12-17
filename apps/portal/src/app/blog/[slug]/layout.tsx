import { PageLayout } from "@/components/page";
import { getBlogPageData } from "./blog-data";

type Props = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

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
      {children}
    </PageLayout>
  );
}
