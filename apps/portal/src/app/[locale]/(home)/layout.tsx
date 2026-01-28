import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";
import { breadcrumb, routes } from "@/lib/routing";

export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <PageContainer route={routes.home} breadcrumbs={breadcrumb(routes.home)}>
      {children}
    </PageContainer>
  );
}
