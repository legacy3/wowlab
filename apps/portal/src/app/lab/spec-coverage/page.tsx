import { PageLayout } from "@/components/page";
import { SpecCoverageContent } from "@/components/lab/spec-coverage";

export default function SpecCoverageRoute() {
  return (
    <PageLayout
      title="Spec Coverage"
      description="Track implementation status of spells, items, and abilities across all specs."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Lab" },
        { label: "Spec Coverage" },
      ]}
    >
      <SpecCoverageContent />
    </PageLayout>
  );
}
