import { PageBreadcrumbs } from "@/components/common";
import { getDocPageData } from "@/lib/docs/data";

type Props = {
  params: Promise<{ slug: string[] }>;
};

export default async function DocBreadcrumb({ params }: Props) {
  const { slug } = await params;
  const { meta } = await getDocPageData(slug);

  return (
    <PageBreadcrumbs
      items={[
        { href: "/", label: "Home" },
        { href: "/docs", label: "Docs" },
        { label: meta.title },
      ]}
    />
  );
}
