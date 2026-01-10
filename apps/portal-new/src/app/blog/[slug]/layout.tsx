import type { ReactNode } from "react";

import { Container } from "styled-system/jsx";

export default function BlogPostLayout({ children }: { children: ReactNode }) {
  return (
    <Container maxW="5xl" py="12">
      {children}
    </Container>
  );
}
