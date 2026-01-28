import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";
import { breadcrumb, routes } from "@/lib/routing";

export default function PlanIndexLayout({ children }: { children: ReactNode }) {
  return (
    <PageContainer
      route={routes.plan.index}
      breadcrumbs={breadcrumb(routes.home, routes.plan.index)}
    >
      {children}
    </PageContainer>
  );
}
