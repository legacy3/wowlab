import { PageLayout } from "@/components/page";

export default function AccountOverviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout
      title="Account"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Account" }]}
    >
      {children}
    </PageLayout>
  );
}
