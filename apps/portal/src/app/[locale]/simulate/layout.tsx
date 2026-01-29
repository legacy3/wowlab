import type { ReactNode } from "react";

import { unauthorized } from "next/navigation";

import { PageContainer } from "@/components/common";
import { breadcrumb, routes } from "@/lib/routing";
import { createClient } from "@/lib/supabase/server";

export default async function SimulateLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    unauthorized();
  }

  return (
    <PageContainer
      route={routes.simulate.index}
      breadcrumbs={breadcrumb(routes.home, routes.simulate.index)}
    >
      {children}
    </PageContainer>
  );
}
