import type { ReactNode } from "react";

import { PageContainer } from "@/components/common";
import { breadcrumb, routes } from "@/lib/routing";

interface RotationsBrowseLayoutProps {
  children: ReactNode;
  modal: ReactNode;
}

export default function RotationsBrowseLayout({
  children,
  modal,
}: RotationsBrowseLayoutProps) {
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
      {modal}
    </PageContainer>
  );
}
