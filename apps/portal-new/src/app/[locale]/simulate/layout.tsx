import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";
import { href, routes } from "@/lib/routing";

export default function SimulateLayout({ children }: { children: ReactNode }) {
  return (
    <PageContainer
      title="Simulate"
      description="Run simulations for your character"
      breadcrumbs={[
        { href: href(routes.home), label: "Home" },
        { label: "Simulate" },
      ]}
    >
      {children}
    </PageContainer>
  );
}
