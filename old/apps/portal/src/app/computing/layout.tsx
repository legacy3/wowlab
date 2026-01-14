import { PageLayout } from "@/components/page";

export default function ComputingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout
      title="Computing"
      description="Worker pool status, simulation history, and system diagnostics"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Computing" }]}
    >
      {children}
    </PageLayout>
  );
}
