import { PageLayout } from "@/components/page";

export default function ChangelogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout
      title="Changelog"
      description="Stay up to date with new features, improvements, and bug fixes"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Changelog" }]}
    >
      {children}
    </PageLayout>
  );
}
