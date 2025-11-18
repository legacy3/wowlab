import { PageLayout } from "@/components/page";
import { SimulationContent } from "@/components/debug/simulation";

export default function SimulationDebugPage() {
  return (
    <PageLayout
      title="Simulation Debug"
      description="Test simulation execution with Effect tracing and debugging"
      breadcrumbs={[
        { label: "Debug", href: "/debug" },
        { label: "Simulation" },
      ]}
    >
      <SimulationContent />
    </PageLayout>
  );
}
