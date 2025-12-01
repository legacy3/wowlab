import { PageLayout } from "@/components/page";
import { DataInspectorContent } from "@/components/data-inspector";

export default function DataInspectorPage() {
  return (
    <PageLayout
      title="Data Inspector"
      description="Query and inspect spell or item data by ID"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Data Inspector" }]}
    >
      <DataInspectorContent />
    </PageLayout>
  );
}
