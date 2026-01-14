import { PageLayout } from "@/components/page";

export default function InspectorSearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout
      title="Data Inspector"
      description="Query and inspect spell or item data by ID"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Lab", href: "/lab" },
        { label: "Inspector" },
      ]}
    >
      {children}
    </PageLayout>
  );
}
