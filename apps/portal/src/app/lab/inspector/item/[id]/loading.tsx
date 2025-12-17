import { PageLayout } from "@/components/page/page-layout";
import { ItemDetailSkeleton } from "@/components/lab/inspector/item";

export default function ItemInspectorLoading() {
  return (
    <PageLayout
      title="Item Inspector"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Lab", href: "/lab" },
        { label: "Inspector", href: "/lab/inspector/search" },
        { label: "Item" },
      ]}
    >
      <ItemDetailSkeleton />
    </PageLayout>
  );
}
