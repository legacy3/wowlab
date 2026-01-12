import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";
import { href, routes } from "@/lib/routing";

export default function BlogIndexLayout({ children }: { children: ReactNode }) {
  return (
    <PageContainer
      title="Blog"
      description="Updates, announcements, and insights from the WoW Lab team."
      breadcrumbs={[
        { href: href(routes.home), label: "Home" },
        { label: "Blog" },
      ]}
    >
      {children}
    </PageContainer>
  );
}
