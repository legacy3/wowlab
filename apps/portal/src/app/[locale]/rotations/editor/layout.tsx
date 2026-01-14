import type { ReactNode } from "react";

import { Container } from "styled-system/jsx";

export default function EditorLayout({ children }: { children: ReactNode }) {
  return (
    <Container maxW="8xl" py="6">
      {children}
    </Container>
  );
}
