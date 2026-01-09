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
      breadcrumbs={[{ href: "/", label: "Home" }, { label: "Simulate" }]}
    >
      {children}
    </PageLayout>
  );
}
