import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";

interface BlogPostLayoutProps {
  breadcrumb: ReactNode;
  children: ReactNode;
}

export default function BlogPostLayout({
  breadcrumb,
  children,
}: BlogPostLayoutProps) {
  return (
    <PageContainer
      title="Blog"
      description="Updates, announcements, and insights from the WoW Lab team"
      breadcrumbs={breadcrumb}
    >
      {children}
    </PageContainer>
  );
}
