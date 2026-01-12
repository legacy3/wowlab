import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";

export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <PageContainer
      title="WoW Lab"
      description="Simulation and theorycrafting tools for World of Warcraft"
      breadcrumbs={[{ label: "Home" }]}
    >
      {children}
    </PageContainer>
  );
}
