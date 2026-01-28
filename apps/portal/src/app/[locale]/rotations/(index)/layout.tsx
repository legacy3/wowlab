import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";
import { breadcrumb, routes } from "@/lib/routing";

export default function RotationsIndexLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <PageContainer
      route={routes.rotations.index}
      breadcrumbs={breadcrumb(routes.home, routes.rotations.index)}
    >
      {children}
    </PageContainer>
  );
}
