import { PageLayout } from "@/components/page";
import { OptimizeTabs } from "@/components/optimize/optimize-tabs";

type Props = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function OptimizePage({ searchParams }: Props) {
  const { tab = "top-gear" } = await searchParams;

  return (
    <PageLayout
      title="Optimize"
      description="Find optimal gear upgrades for your character"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Optimize" }]}
    >
      <OptimizeTabs activeTab={tab} />
    </PageLayout>
  );
}
