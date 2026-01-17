"use client";

import type { ReactNode } from "react";

import { ChevronRightIcon } from "lucide-react";

import * as Collapsible from "@/components/ui/collapsible";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

type MdCollapsibleProps = {
  children: ReactNode;
  title: string;
  defaultOpen?: boolean;
};

export function MdCollapsible({
  children,
  defaultOpen = false,
  title,
}: MdCollapsibleProps) {
  return (
    <Collapsible.Root defaultOpen={defaultOpen}>
      <Collapsible.Trigger
        display="flex"
        alignItems="center"
        gap="1"
        py="2"
        cursor="pointer"
        _hover={{ color: "fg.default" }}
      >
        <Collapsible.Indicator>
          <Icon size="sm">
            <ChevronRightIcon />
          </Icon>
        </Collapsible.Indicator>
        <Text fontWeight="medium">{title}</Text>
      </Collapsible.Trigger>
      <Collapsible.Content pl="6">{children}</Collapsible.Content>
    </Collapsible.Root>
  );
}
