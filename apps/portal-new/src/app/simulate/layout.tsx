import { PageLayout } from "@/components/layout";

export default function SimulateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout
      title="Simulate"
      description="Run character simulations to optimize your performance"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Simulate" }]}
    >
      {children}
    </PageLayout>
  );
}
