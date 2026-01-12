import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";
import { href, routes } from "@/lib/routing";

export default function DocsIndexLayout({ children }: { children: ReactNode }) {
  return (
    <PageContainer
      title="Documentation"
      description="Learn how to use WoW Lab for theorycrafting and simulation."
      breadcrumbs={[
        { href: href(routes.home), label: "Home" },
        { label: "Docs" },
      ]}
    >
      {children}
    </PageContainer>
  );
}
