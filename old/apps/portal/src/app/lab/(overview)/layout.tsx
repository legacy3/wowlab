import { PageLayout } from "@/components/page";

export default function LabOverviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout
      title="Lab"
      description="Experimental tools and data exploration"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Lab" }]}
    >
      {children}
    </PageLayout>
  );
}
