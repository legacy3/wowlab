import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";

export default function ComputingLayout({ children }: { children: ReactNode }) {
  return (
    <PageContainer
      title="Computing"
      description="Worker pool status, simulation history, and system diagnostics"
      breadcrumbs={[{ href: "/", label: "Home" }, { label: "Computing" }]}
    >
      {children}
    </PageContainer>
  );
}
