import { requireAuth } from "@/lib/auth/require-auth";
import { PageLayout } from "@/components/page";
import { AccountTabs } from "@/components/account/account-tabs";

export default async function AccountPage() {
  const { profile, supabase } = await requireAuth();

  const { data: rotations } = await supabase
    .from("rotations")
    .select("*")
    .eq("user_id", profile.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  return (
    <PageLayout
      title="Account"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Account" }]}
    >
      <AccountTabs profile={profile} rotations={rotations ?? []} />
    </PageLayout>
  );
}
