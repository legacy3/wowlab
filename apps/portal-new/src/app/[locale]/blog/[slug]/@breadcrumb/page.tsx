import { PageBreadcrumbs } from "@/components/common";
import { getBlogPageData } from "@/lib/blog/data";
import { breadcrumb, routes } from "@/lib/routing";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function BlogBreadcrumb({ params }: Props) {
  const { slug } = await params;
  const { entry } = await getBlogPageData(slug);

  return (
    <PageBreadcrumbs
      items={breadcrumb(routes.home, routes.blog.index, entry.title)}
    />
  );
}
