import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";
import { routes } from "@/lib/routing";

interface BlogPostLayoutProps {
  breadcrumb: ReactNode;
  children: ReactNode;
}

export default function BlogPostLayout({
  breadcrumb,
  children,
}: BlogPostLayoutProps) {
  return (
    <PageContainer route={routes.blog.index} breadcrumbs={breadcrumb}>
      {children}
    </PageContainer>
  );
}
