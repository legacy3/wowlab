import { PageLayout } from "@/components/page";
import { SimulationResultTabs } from "@/components/simulate/simulation-result-tabs";

export default function SimulationResultPage() {
  return (
    <PageLayout
      title="Simulation Results"
      description="View simulation results and analysis"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Simulate", href: "/simulate" },
        { label: "Results" },
      ]}
    >
      <SimulationResultTabs />
    </PageLayout>
  );
}
