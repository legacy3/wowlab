import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";
import { breadcrumb, routes } from "@/lib/routing";

export default function NodesClaimLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <PageContainer
      route={routes.account.nodes.claim}
      breadcrumbs={breadcrumb(
        routes.home,
        routes.account.index,
        routes.account.nodes.index,
        routes.account.nodes.claim,
      )}
    >
      {children}
    </PageContainer>
  );
}
