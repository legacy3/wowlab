import { PageLayout } from "@/components/page";
import { SimulationResultTabs } from "@/components/simulate/simulation-result-tabs";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; compare?: string }>;
};

export default async function SimulationResultPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const { tab = "overview", compare } = await searchParams;

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
      <SimulationResultTabs resultId={id} activeTab={tab} compareId={compare} />
    </PageLayout>
  );
}
