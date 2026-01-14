import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";

interface UserProfileLayoutProps {
  breadcrumb: ReactNode;
  children: ReactNode;
}

export default function UserProfileLayout({
  breadcrumb,
  children,
}: UserProfileLayoutProps) {
  return <PageContainer breadcrumbs={breadcrumb}>{children}</PageContainer>;
}
