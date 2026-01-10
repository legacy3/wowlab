import type { ReactNode } from "react";

import { Box } from "styled-system/jsx";

import { Code } from "@/components/ui/code";

type MdCodeProps = {
  className?: string;
  children: ReactNode;
};

export function MdCode({ children, className }: MdCodeProps) {
  const isCodeBlock = /language-(\w+)/.test(className || "");

  if (isCodeBlock) {
    return (
      <Box
        as="pre"
        my="6"
        p="4"
        bg="gray.subtle.bg"
        borderRadius="md"
        overflow="auto"
        fontFamily="mono"
        textStyle="sm"
        lineHeight="relaxed"
        whiteSpace="pre"
      >
        <code>{children}</code>
      </Box>
    );
  }

  return <Code>{children}</Code>;
}

export function MdPre({ children }: MdCodeProps) {
  return <>{children}</>;
}
