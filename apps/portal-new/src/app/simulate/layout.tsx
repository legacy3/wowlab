import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";

export default function SimulateLayout({ children }: { children: ReactNode }) {
  return (
    <PageContainer
      title="Simulate"
      description="Run simulations for your character"
      breadcrumbs={[{ href: "/", label: "Home" }, { label: "Simulate" }]}
    >
      {children}
    </PageContainer>
  );
}
