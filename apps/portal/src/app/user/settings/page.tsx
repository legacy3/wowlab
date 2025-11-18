import { requireAuth } from "@/lib/auth/require-auth";
import { PageLayout } from "@/components/page";
import { UserSettingsForm } from "@/components/user/user-settings-form";

export default async function SettingsPage() {
  await requireAuth();

  return (
    <PageLayout
      title="Settings"
      description="Manage your account settings and preferences"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Profile", href: "/user/profile" },
        { label: "Settings" },
      ]}
    >
      <UserSettingsForm />
    </PageLayout>
  );
}
