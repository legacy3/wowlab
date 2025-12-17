import { PageLayout } from "@/components/page";

export default function OptimizeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout
      title="Optimize"
      description="Find optimal gear upgrades for your character"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Optimize" }]}
    >
      {children}
    </PageLayout>
  );
}
