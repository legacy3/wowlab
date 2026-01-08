import { PageLayout } from "@/components/layout";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageLayout
      title="Components"
      description="UI component demos"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Components" }]}
    >
      {children}
    </PageLayout>
  );
}
