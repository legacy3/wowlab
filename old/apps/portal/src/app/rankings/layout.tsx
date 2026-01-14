import { PageLayout } from "@/components/page";

export default function RankingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout
      title="Rankings"
      description="Explore rankings, loot demand, and standout public simulations."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Rankings" }]}
    >
      {children}
    </PageLayout>
  );
}
