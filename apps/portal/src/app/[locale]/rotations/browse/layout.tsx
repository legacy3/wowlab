import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";
import { breadcrumb, routes } from "@/lib/routing";

export default function RotationsBrowseLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <PageContainer
      route={routes.rotations.browse}
      breadcrumbs={breadcrumb(
        routes.home,
        routes.rotations.index,
        routes.rotations.browse,
      )}
    >
      {children}
    </PageContainer>
  );
}
