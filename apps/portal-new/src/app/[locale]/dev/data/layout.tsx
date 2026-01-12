import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";
import { href, routes } from "@/lib/routing";

export default function DevDataLayout({ children }: { children: ReactNode }) {
  return (
    <PageContainer
      title="Game Data"
      description="Game data hooks for spells, items, classes, and specs"
      breadcrumbs={[
        { href: href(routes.home), label: "Home" },
        { href: href(routes.dev.index), label: "Dev" },
        { label: "Data" },
      ]}
    >
      {children}
    </PageContainer>
  );
}
