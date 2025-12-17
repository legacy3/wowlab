import { PageLayout } from "@/components/page";

export default function SpecCoverageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout
      title="Spec Coverage"
      description="Track implementation status of spells, items, and abilities across all specs."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Lab" },
        { label: "Spec Coverage" },
      ]}
    >
      {children}
    </PageLayout>
  );
}
