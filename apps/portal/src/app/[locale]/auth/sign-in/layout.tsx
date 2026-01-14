import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";
import { breadcrumb, routes } from "@/lib/routing";

export default function SignInLayout({ children }: { children: ReactNode }) {
  return (
    <PageContainer
      route={routes.auth.signIn}
      breadcrumbs={breadcrumb(routes.home, routes.auth.signIn)}
    >
      {children}
    </PageContainer>
  );
}
