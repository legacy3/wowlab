import { PageLayout } from "@/components/page";
import { OptimizeTabs } from "@/components/optimize/optimize-tabs";

export default function OptimizePage() {
  return (
    <PageLayout
      title="Optimize"
      description="Find optimal gear upgrades for your character"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Optimize" }]}
    >
      <OptimizeTabs />
    </PageLayout>
  );
}
