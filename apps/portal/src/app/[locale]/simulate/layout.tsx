import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";
import { breadcrumb, routes } from "@/lib/routing";

export default function SimulateLayout({ children }: { children: ReactNode }) {
  return (
    <PageContainer
      route={routes.simulate.index}
      breadcrumbs={breadcrumb(routes.home, routes.simulate.index)}
    >
      {children}
    </PageContainer>
  );
}
