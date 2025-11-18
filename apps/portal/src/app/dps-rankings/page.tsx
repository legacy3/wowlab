import { PageLayout } from "@/components/page";
import { DpsRankings } from "@/components/dps/dps-rankings";

export default function DpsRankingsPage() {
  return (
    <PageLayout
      title="DPS Rankings"
      description="Explore rankings, loot demand, and standout public simulations."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "DPS Rankings" }]}
    >
      <DpsRankings />
    </PageLayout>
  );
}
