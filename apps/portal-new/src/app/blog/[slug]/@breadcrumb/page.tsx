import { PageBreadcrumbs } from "@/components/common";
import { getBlogPageData } from "@/lib/blog/data";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function BlogBreadcrumb({ params }: Props) {
  const { slug } = await params;
  const { entry } = await getBlogPageData(slug);

  return (
    <PageBreadcrumbs
      items={[
        { href: "/", label: "Home" },
        { href: "/blog", label: "Blog" },
        { label: entry.title },
      ]}
    />
  );
}
