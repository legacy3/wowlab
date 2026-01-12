import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";

export default function DevDataLayout({ children }: { children: ReactNode }) {
  return (
    <PageContainer
      title="Game Data"
      description="Game data hooks for spells, items, classes, and specs"
      breadcrumbs={[
        { href: "/", label: "Home" },
        { href: "/dev", label: "Dev" },
        { label: "Data" },
      ]}
    >
      {children}
    </PageContainer>
  );
}
