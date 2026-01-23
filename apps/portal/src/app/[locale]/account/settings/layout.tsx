import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";
import { breadcrumb, routes } from "@/lib/routing";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <PageContainer
      maxW="3xl"
      route={routes.account.settings}
      breadcrumbs={breadcrumb(
        routes.home,
        routes.account.index,
        routes.account.settings,
      )}
    >
      {children}
    </PageContainer>
  );
}
