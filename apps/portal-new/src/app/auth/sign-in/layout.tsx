import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";

export default function SignInLayout({ children }: { children: ReactNode }) {
  return (
    <PageContainer
      title="Sign In"
      description="Sign in to your WoW Lab account"
      breadcrumbs={[{ href: "/", label: "Home" }, { label: "Sign In" }]}
    >
      {children}
    </PageContainer>
  );
}
