import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";
import { breadcrumb, routes } from "@/lib/routing";

export default function DevMetricsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <PageContainer
      route={routes.dev.metrics}
      breadcrumbs={breadcrumb(
        routes.home,
        routes.dev.index,
        routes.dev.metrics,
      )}
    >
      {children}
    </PageContainer>
  );
}
