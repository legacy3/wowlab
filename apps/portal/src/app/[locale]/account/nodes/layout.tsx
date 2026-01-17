import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";
import { breadcrumb, routes } from "@/lib/routing";

export default function NodesLayout({ children }: { children: ReactNode }) {
  return (
    <PageContainer
      route={routes.account.nodes.index}
      breadcrumbs={breadcrumb(
        routes.home,
        routes.account.index,
        routes.account.nodes.index,
      )}
    >
      {children}
    </PageContainer>
  );
}
