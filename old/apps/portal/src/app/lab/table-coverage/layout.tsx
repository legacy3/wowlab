import { PageLayout } from "@/components/page";

export default function TableCoverageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout
      title="Table Coverage"
      description="All DBC tables available in the system."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Lab" },
        { label: "Table Coverage" },
      ]}
    >
      {children}
    </PageLayout>
  );
}
