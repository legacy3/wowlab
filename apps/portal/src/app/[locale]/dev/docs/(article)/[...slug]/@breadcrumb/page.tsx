import { PageBreadcrumbs } from "@/components/common";
import { getDocPageData } from "@/lib/docs/data";
import { breadcrumb, routes } from "@/lib/routing";

type Props = {
  params: Promise<{ slug: string[] }>;
};

export default async function DocBreadcrumb({ params }: Props) {
  const { slug } = await params;
  const { meta } = await getDocPageData(slug);

  return (
    <PageBreadcrumbs
      items={breadcrumb(routes.home, routes.dev.docs.index, meta.title)}
    />
  );
}
