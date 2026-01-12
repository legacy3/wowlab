import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";

interface DocArticleLayoutProps {
  breadcrumb: ReactNode;
  children: ReactNode;
}

export default function DocArticleLayout({
  breadcrumb,
  children,
}: DocArticleLayoutProps) {
  return (
    <PageContainer
      title="Documentation"
      description="Learn how to use WoW Lab for theorycrafting and simulation"
      breadcrumbs={breadcrumb}
    >
      {children}
    </PageContainer>
  );
}
