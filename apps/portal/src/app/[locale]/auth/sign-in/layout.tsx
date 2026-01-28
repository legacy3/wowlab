import type { ReactNode } from "react";

import { Flex } from "styled-system/jsx";

export default function SignInLayout({ children }: { children: ReactNode }) {
  return (
    <Flex justify="center" py="12">
      {children}
    </Flex>
  );
}
