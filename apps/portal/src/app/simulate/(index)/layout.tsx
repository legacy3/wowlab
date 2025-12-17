import { PageLayout } from "@/components/page";

export default function SimulateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout
      title="Simulate"
      description="Configure your character and run a simulation"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Simulate" }]}
    >
      {children}
    </PageLayout>
  );
}
