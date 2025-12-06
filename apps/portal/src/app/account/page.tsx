// TODO(refine-migration): Replace with Refine auth in Phase 4/5
// import { requireAuth } from "@/lib/auth/require-auth";
import { PageLayout } from "@/components/page";
import { AccountTabs } from "@/components/account/account-tabs";
import type { Database } from "@/lib/supabase/database.types";

type Rotation = Database["public"]["Tables"]["rotations"]["Row"];

export default async function AccountPage() {
  // TODO(refine-migration): Replace with Refine useIsAuthenticated + useGetIdentity hooks
  // For now, this page will show empty state - implement with Refine in Phase 4/5
  // const { profile, supabase } = await requireAuth();
  // const { data: rotations } = await supabase
  //   .from("rotations")
  //   .select("*")
  //   .eq("user_id", profile.id)
  //   .is("deleted_at", null)
  //   .order("updated_at", { ascending: false });

  // Temporary placeholder until Refine migration
  const profile = {
    id: "",
    handle: "",
    avatarUrl: null as string | null,
    createdAt: new Date().toISOString(),
    email: "",
    updatedAt: new Date().toISOString(),
  };
  const rotations: Rotation[] = [];

  return (
    <PageLayout
      title="Account"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Account" }]}
    >
      <AccountTabs profile={profile} rotations={rotations} />
    </PageLayout>
  );
}
