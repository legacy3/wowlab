import { PageLayout } from "@/components/page";

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout
      title="About"
      description="What is WoW Lab and how does it work"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "About" }]}
    >
      {children}
    </PageLayout>
  );
}
