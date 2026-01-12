import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";

export default function RotationsIndexLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <PageContainer
      title="Rotations"
      description="Browse and create simulation rotations"
      breadcrumbs={[{ href: "/", label: "Home" }, { label: "Rotations" }]}
    >
      {children}
    </PageContainer>
  );
}
