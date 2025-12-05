import { PageLayout } from "@/components/page";
import { DpsRankings } from "@/components/rankings/rankings";

export default function RankingsPage() {
  return (
    <PageLayout
      title="Rankings"
      description="Explore rankings, loot demand, and standout public simulations."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Rankings" }]}
    >
      <DpsRankings />
    </PageLayout>
  );
}
