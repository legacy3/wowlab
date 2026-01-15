import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";
import { breadcrumb, routes } from "@/lib/routing";

export default function DevEngineLayout({ children }: { children: ReactNode }) {
  return (
    <PageContainer
      route={routes.dev.engine}
      breadcrumbs={breadcrumb(routes.home, routes.dev.index, routes.dev.engine)}
    >
      {children}
    </PageContainer>
  );
}
