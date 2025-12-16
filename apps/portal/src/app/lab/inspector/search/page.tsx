import { PageLayout } from "@/components/page";
import { InspectorSearchContent } from "@/components/lab/inspector/search";

export default function InspectorSearchPage() {
  return (
    <PageLayout
      title="Data Inspector"
      description="Query and inspect spell or item data by ID"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Lab", href: "/lab" },
        { label: "Inspector" },
      ]}
    >
      <InspectorSearchContent />
    </PageLayout>
  );
}
