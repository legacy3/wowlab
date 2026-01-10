import type { ReactNode } from "react";

import { Container } from "styled-system/jsx";

export default function DocsIndexLayout({ children }: { children: ReactNode }) {
  return (
    <Container maxW="3xl" py="12">
      {children}
    </Container>
  );
}
