import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";

export default function DocsIndexLayout({ children }: { children: ReactNode }) {
  return (
    <PageContainer
      title="Documentation"
      description="Learn how to use WoW Lab for theorycrafting and simulation."
      breadcrumbs={[{ href: "/", label: "Home" }, { label: "Docs" }]}
    >
      {children}
    </PageContainer>
  );
}
