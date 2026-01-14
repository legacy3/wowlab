import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";
import { breadcrumb, routes } from "@/lib/routing";

export default function DevHooksLayout({ children }: { children: ReactNode }) {
  return (
    <PageContainer
      route={routes.dev.hooks}
      breadcrumbs={breadcrumb(routes.home, routes.dev.index, routes.dev.hooks)}
    >
      {children}
    </PageContainer>
  );
}
