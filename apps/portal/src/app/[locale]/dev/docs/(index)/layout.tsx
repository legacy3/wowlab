import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";
import { breadcrumb, routes } from "@/lib/routing";

export default function DocsIndexLayout({ children }: { children: ReactNode }) {
  return (
    <PageContainer
      route={routes.dev.docs.index}
      breadcrumbs={breadcrumb(
        routes.home,
        routes.dev.index,
        routes.dev.docs.index,
      )}
    >
      {children}
    </PageContainer>
  );
}
