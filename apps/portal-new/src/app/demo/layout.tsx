import { PageLayout } from "@/components/layout";

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout
      title="UI Components"
      description="Component library reference for contributors"
      breadcrumbs={[{ href: "/", label: "Home" }, { label: "Components" }]}
    >
      {children}
    </PageLayout>
  );
}
