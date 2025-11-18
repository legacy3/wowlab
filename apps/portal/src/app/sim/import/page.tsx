import { PageLayout } from "@/components/page";
import { ImportContent } from "@/components/sim/import-content";

export default function ImportPage() {
  return (
    <PageLayout
      title="Import Character"
      description="Import character data and configurations"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Simulate", href: "/sim" },
        { label: "Import" },
      ]}
    >
      <ImportContent />
    </PageLayout>
  );
}
