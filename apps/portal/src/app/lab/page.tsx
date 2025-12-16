import { PageLayout } from "@/components/page";
import { LabContent } from "@/components/lab/overview";

export default function LabPage() {
  return (
    <PageLayout
      title="Lab"
      description="Experimental tools and data exploration"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Lab" }]}
    >
      <LabContent />
    </PageLayout>
  );
}
