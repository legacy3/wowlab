import { PageLayout } from "@/components/page";

export default function DocsIndexLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout
      title="Documentation"
      description="Technical documentation for WoW Lab"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Docs" }]}
    >
      {children}
    </PageLayout>
  );
}
