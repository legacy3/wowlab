import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";
import { breadcrumb, routes } from "@/lib/routing";

export default function BlogIndexLayout({ children }: { children: ReactNode }) {
  return (
    <PageContainer
      route={routes.blog.index}
      breadcrumbs={breadcrumb(routes.home, routes.blog.index)}
    >
      {children}
    </PageContainer>
  );
}
