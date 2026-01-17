import { PageBreadcrumbs } from "@/components/common";
import { getDocPageData } from "@/lib/content/docs";
import { breadcrumb, routes } from "@/lib/routing";

type Props = {
  params: Promise<{ slug: string[] }>;
};

export default async function DocBreadcrumb({ params }: Props) {
  const { slug } = await params;
  const { title } = await getDocPageData(slug);

  return (
    <PageBreadcrumbs
      items={breadcrumb(routes.home, routes.dev.docs.index, title)}
    />
  );
}
