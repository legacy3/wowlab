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
  return <PageContainer breadcrumbs={breadcrumb}>{children}</PageContainer>;
}
