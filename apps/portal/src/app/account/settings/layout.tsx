import { unauthorized } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageLayout } from "@/components/page";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    unauthorized();
  }

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
