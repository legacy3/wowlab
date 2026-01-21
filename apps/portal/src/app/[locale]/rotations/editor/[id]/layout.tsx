import type { ReactNode } from "react";

import { Stack } from "styled-system/jsx";

interface EditRotationLayoutProps {
  breadcrumb: ReactNode;
  children: ReactNode;
}

export default function EditRotationLayout({
  breadcrumb,
  children,
}: EditRotationLayoutProps) {
  return (
    <Stack gap="4">
      {breadcrumb}
      {children}
    </Stack>
  );
}
