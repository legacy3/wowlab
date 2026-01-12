import { PageBreadcrumbs } from "@/components/common";
import { getBlogPageData } from "@/lib/blog/data";
import { href, routes } from "@/lib/routing";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function BlogBreadcrumb({ params }: Props) {
  const { slug } = await params;
  const { entry } = await getBlogPageData(slug);

  return (
    <PageBreadcrumbs
      items={[
        { href: href(routes.home), label: "Home" },
        { href: href(routes.blog.index), label: "Blog" },
        { label: entry.title },
      ]}
    />
  );
}
