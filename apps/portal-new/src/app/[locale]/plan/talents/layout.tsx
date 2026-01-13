import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";
import { breadcrumb, routes } from "@/lib/routing";

export default function TalentsLayout({ children }: { children: ReactNode }) {
  return (
    <PageContainer
      route={routes.plan.talents}
      breadcrumbs={breadcrumb(routes.home, routes.plan.index, routes.plan.talents)}
    >
      {children}
    </PageContainer>
  );
}
