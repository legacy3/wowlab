import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";
import { href, routes } from "@/lib/routing";

export default function DevUiLayout({ children }: { children: ReactNode }) {
  return (
    <PageContainer
      title="UI Components"
      description="Park UI components with Panda CSS recipes"
      breadcrumbs={[
        { href: href(routes.home), label: "Home" },
        { href: href(routes.dev.index), label: "Dev" },
        { label: "UI" },
      ]}
    >
      {children}
    </PageContainer>
  );
}
