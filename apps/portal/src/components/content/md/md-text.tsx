import type { ReactNode } from "react";

import { Box, styled } from "styled-system/jsx";

import { Text } from "@/components/ui/text";

type MdTextProps = {
  children: ReactNode;
};

const Blockquote = styled("blockquote");

export function MdBlockquote({ children }: MdTextProps) {
  return <Blockquote>{children}</Blockquote>;
}

export function MdDel({ children }: MdTextProps) {
  return (
    <Text as="del" textDecoration="line-through" color="fg.muted">
      {children}
    </Text>
  );
}

export function MdEm({ children }: MdTextProps) {
  return (
    <Text as="em" fontStyle="italic">
      {children}
    </Text>
  );
}

export function MdHr() {
  return (
    <Box
      as="hr"
      my="8"
      borderTopWidth="1px"
      borderColor="border.muted"
      borderStyle="solid"
    />
  );
}

export function MdParagraph({ children }: MdTextProps) {
  return <Text as="p">{children}</Text>;
}

export function MdStrong({ children }: MdTextProps) {
  return (
    <Text as="strong" fontWeight="semibold">
      {children}
    </Text>
  );
}
