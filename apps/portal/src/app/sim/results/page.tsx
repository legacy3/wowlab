import { PageLayout } from "@/components/page";
import { ResultsOverview } from "@/components/sim/results-overview";

export default function ResultsPage() {
  return (
    <PageLayout
      title="Simulation Results"
      description="Character gear and results"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Simulate", href: "/sim" },
        { label: "Results" },
      ]}
    >
      <ResultsOverview />
    </PageLayout>
  );
}
