import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";
import { breadcrumb, routes } from "@/lib/routing";

export default function DevUiLayout({ children }: { children: ReactNode }) {
  return (
    <PageContainer
      route={routes.dev.ui}
      breadcrumbs={breadcrumb(routes.home, routes.dev.index, routes.dev.ui)}
    >
      {children}
    </PageContainer>
  );
}
