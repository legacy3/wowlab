import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";
import { href, routes } from "@/lib/routing";

export default function RotationsIndexLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <PageContainer
      title="Rotations"
      description="Browse and create simulation rotations"
      breadcrumbs={[
        { href: href(routes.home), label: "Home" },
        { label: "Rotations" },
      ]}
    >
      {children}
    </PageContainer>
  );
}
