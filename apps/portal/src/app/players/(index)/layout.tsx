import { PageLayout } from "@/components/page";

export default function PlayersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout
      title="Players"
      description="Browse player profiles and rankings."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Players" }]}
    >
      {children}
    </PageLayout>
  );
}
