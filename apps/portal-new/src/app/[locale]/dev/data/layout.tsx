import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";
import { breadcrumb, routes } from "@/lib/routing";

export default function DevDataLayout({ children }: { children: ReactNode }) {
  return (
    <PageContainer
      route={routes.dev.data}
      breadcrumbs={breadcrumb(routes.home, routes.dev.index, routes.dev.data)}
    >
      {children}
    </PageContainer>
  );
}
