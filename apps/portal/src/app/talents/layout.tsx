import { PageLayout } from "@/components/page";

export default function TalentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout
      title="Talent Calculator"
      description="View and share talent builds using talent strings"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Talents" }]}
    >
      {children}
    </PageLayout>
  );
}
