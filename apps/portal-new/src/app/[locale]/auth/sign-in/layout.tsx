import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";
import { href, routes } from "@/lib/routing";

export default function SignInLayout({ children }: { children: ReactNode }) {
  return (
    <PageContainer
      title="Sign In"
      description="Sign in to your WoW Lab account"
      breadcrumbs={[
        { href: href(routes.home), label: "Home" },
        { label: "Sign In" },
      ]}
    >
      {children}
    </PageContainer>
  );
}
