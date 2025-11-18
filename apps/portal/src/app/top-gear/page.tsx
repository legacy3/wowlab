import { PageLayout } from "@/components/page";
import { TopGearDashboard } from "@/components/top-gear/top-gear-dashboard";

export default function TopGearPage() {
  return (
    <PageLayout
      title="Top Gear"
      description="Find optimal gear upgrades for your character"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Top Gear" }]}
    >
      <TopGearDashboard />
    </PageLayout>
  );
}
