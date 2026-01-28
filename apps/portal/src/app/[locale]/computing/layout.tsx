import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";
import { breadcrumb, routes } from "@/lib/routing";

export default function ComputingLayout({ children }: { children: ReactNode }) {
  return (
    <PageContainer
      route={routes.computing}
      breadcrumbs={breadcrumb(routes.home, routes.computing)}
    >
      {children}
    </PageContainer>
  );
}
