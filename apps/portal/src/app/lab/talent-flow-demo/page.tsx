import { PageLayout } from "@/components/page";
import { TalentFlowDemoContent } from "@/components/lab/talent-flow-demo";

export default function TalentFlowDemoPage() {
  return (
    <PageLayout
      title="Talent Flow Demo"
      description="Compare current talent tree rendering with React Flow implementation"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Lab" },
        { label: "Talent Flow Demo" },
      ]}
    >
      <TalentFlowDemoContent />
    </PageLayout>
  );
}
