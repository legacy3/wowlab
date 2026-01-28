import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";
import { breadcrumb, routes } from "@/lib/routing";

export default function AboutLayout({ children }: { children: ReactNode }) {
  return (
    <PageContainer
      route={routes.about.index}
      breadcrumbs={breadcrumb(routes.home, routes.about.index)}
    >
      {children}
    </PageContainer>
  );
}
