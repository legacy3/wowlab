import { PageLayout } from "@/components/page";
import { DpsRankings } from "@/components/rankings/rankings";

type Props = {
  searchParams: Promise<{ spec?: string }>;
};

export default async function RankingsPage({ searchParams }: Props) {
  const { spec } = await searchParams;

  return (
    <PageLayout
      title="Rankings"
      description="Explore rankings, loot demand, and standout public simulations."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Rankings" }]}
    >
      <DpsRankings specFilter={spec} />
    </PageLayout>
  );
}
