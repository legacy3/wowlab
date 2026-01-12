import { PageBreadcrumbs } from "@/components/common";
import { getDocPageData } from "@/lib/docs/data";
import { href, routes } from "@/lib/routing";

type Props = {
  params: Promise<{ slug: string[] }>;
};

export default async function DocBreadcrumb({ params }: Props) {
  const { slug } = await params;
  const { meta } = await getDocPageData(slug);

  return (
    <PageBreadcrumbs
      items={[
        { href: href(routes.home), label: "Home" },
        { href: href(routes.dev.docs.index), label: "Docs" },
        { label: meta.title },
      ]}
    />
  );
}
