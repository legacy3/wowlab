import { PageLayout } from "@/components/page/page-layout";
import { ItemDetailPage } from "@/components/lab/inspector/item-detail-page";

interface ItemInspectorPageProps {
  params: Promise<{ id: string }>;
}

export default async function ItemInspectorPage({
  params,
}: ItemInspectorPageProps) {
  const { id } = await params;

  return (
    <PageLayout
      title="Item Inspector"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Lab", href: "/lab" },
        { label: "Inspector", href: "/lab/inspector/search" },
        { label: `Item #${id}` },
      ]}
    >
      <ItemDetailPage itemId={id} />
    </PageLayout>
  );
}
