import { unauthorized } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageLayout } from "@/components/page";

export default async function AccountOverviewLayout({
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
      title="Account"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Account" }]}
    >
      {children}
    </PageLayout>
  );
}
