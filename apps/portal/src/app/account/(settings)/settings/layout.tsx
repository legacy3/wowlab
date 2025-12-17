import { PageLayout } from "@/components/page";

export default function AccountSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout
      title="Settings"
      description="Manage your account settings and preferences"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Account", href: "/account" },
        { label: "Settings" },
      ]}
    >
      {children}
    </PageLayout>
  );
}
