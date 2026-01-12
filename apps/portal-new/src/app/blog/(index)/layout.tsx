import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";

export default function BlogIndexLayout({ children }: { children: ReactNode }) {
  return (
    <PageContainer
      title="Blog"
      description="Updates, announcements, and insights from the WoW Lab team."
      breadcrumbs={[{ href: "/", label: "Home" }, { label: "Blog" }]}
    >
      {children}
    </PageContainer>
  );
}
