import { PageLayout } from "@/components/page";

export default function SimulationResultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      {children}
    </PageLayout>
  );
}
