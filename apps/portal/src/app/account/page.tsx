import { requireAuth } from "@/lib/auth/require-auth";
import { PageLayout } from "@/components/page";
import { AccountTabs } from "@/components/account/account-tabs";

type Props = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function AccountPage({ searchParams }: Props) {
  const { profile, supabase } = await requireAuth();
  const { tab = "rotations" } = await searchParams;

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
      <AccountTabs
        profile={profile}
        rotations={rotations ?? []}
        activeTab={tab}
      />
    </PageLayout>
  );
}
