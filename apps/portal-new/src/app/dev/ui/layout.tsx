import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";

export default function DevUiLayout({ children }: { children: ReactNode }) {
  return (
    <PageContainer
      title="UI Components"
      description="Park UI components with Panda CSS recipes"
      breadcrumbs={[
        { href: "/", label: "Home" },
        { href: "/dev", label: "Dev" },
        { label: "UI" },
      ]}
    >
      {children}
    </PageContainer>
  );
}
