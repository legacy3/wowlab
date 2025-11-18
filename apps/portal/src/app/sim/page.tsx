import { PageLayout } from "@/components/page";
import { QuickSimContent } from "@/components/sim/quick-sim-content";

export default function QuickSimPage() {
  return (
    <PageLayout
      title="Quick Simulation"
      description="Configure your character and run a simulation in seconds"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Simulate" }]}
    >
      <QuickSimContent />
    </PageLayout>
  );
}
