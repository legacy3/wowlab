import type { ReactNode } from "react";

import { styled } from "styled-system/jsx";

import { Text } from "@/components/ui/text";

type MdTextProps = {
  children: ReactNode;
};

const Blockquote = styled("blockquote");

export function MdBlockquote({ children }: MdTextProps) {
  return <Blockquote>{children}</Blockquote>;
}

export function MdParagraph({ children }: MdTextProps) {
  return <Text as="p">{children}</Text>;
}
