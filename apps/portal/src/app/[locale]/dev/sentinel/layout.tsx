import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";
import { breadcrumb, routes } from "@/lib/routing";

export default function DevSentinelLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <PageContainer
      route={routes.dev.sentinel}
      breadcrumbs={breadcrumb(
        routes.home,
        routes.dev.index,
        routes.dev.sentinel,
      )}
    >
      {children}
    </PageContainer>
  );
}
