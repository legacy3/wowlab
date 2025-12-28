import { PageLayout } from "@/components/page";

export default function NodesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout
      title="Compute Nodes"
      description="Manage your simulation compute nodes"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Account", href: "/account" },
        { label: "Nodes" },
      ]}
    >
      {children}
    </PageLayout>
  );
}
