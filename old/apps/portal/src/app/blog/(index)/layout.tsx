import { PageLayout } from "@/components/page";

export default function BlogIndexLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout
      title="Blog"
      description="Updates, tutorials, and insights from the WoW Lab team"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Blog" }]}
    >
      {children}
    </PageLayout>
  );
}
