// TODO(refine-migration): Replace with Refine auth in Phase 4/5
// import { requireAuth } from "@/lib/auth/require-auth";
import { PageLayout } from "@/components/page";
import { SettingsOverview } from "@/components/account/settings-overview";

export default async function SettingsPage() {
  // TODO(refine-migration): Replace with Refine useIsAuthenticated hook
  // For now, this page is accessible without auth - implement protection with Refine in Phase 4/5
  // await requireAuth();

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
      <SettingsOverview />
    </PageLayout>
  );
}
