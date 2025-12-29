import { unauthorized } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageLayout } from "@/components/page";

export default async function NodesLayout({
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
      title="Compute Nodes"
      description="Manage your simulation compute nodes"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Account", href: "/account" },
        { label: "Nodes" },
      ]}
    >
      {children}
    </PageLayout>
  );
}
