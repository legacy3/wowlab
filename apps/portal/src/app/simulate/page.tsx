import { PageLayout } from "@/components/page";
import { QuickSimContent } from "@/components/simulate/quick-sim-content";

export default function SimulatePage() {
  return (
    <PageLayout
      title="Simulate"
      description="Configure your character and run a simulation"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Simulate" }]}
    >
      <QuickSimContent />
    </PageLayout>
  );
}
