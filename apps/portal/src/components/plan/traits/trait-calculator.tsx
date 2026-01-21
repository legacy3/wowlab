"use client";

import { X } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { css } from "styled-system/css";
import { Flex, HStack } from "styled-system/jsx";

import {
  IconButton,
  Link,
  Loader,
  Tooltip as UITooltip,
} from "@/components/ui";
import { routes } from "@/lib/routing";
import { useSpecTraits } from "@/lib/state";

import { TraitCanvas } from "./canvas";

const headerStyles = css({
  alignItems: "center",
  bg: "bg.default",
  borderBottom: "1px solid",
  borderColor: "border.default",
  display: "flex",
  gap: "3",
  h: "12",
  px: "3",
});

const titleStyles = css({
  color: "fg.default",
  fontSize: "sm",
  fontWeight: "medium",
});

const subtitleStyles = css({
  color: "fg.muted",
  fontSize: "sm",
});

interface TraitCalculatorProps {
  specId: number;
}

export function TraitCalculator({ specId }: TraitCalculatorProps) {
  const { data: specTraits } = useSpecTraits(specId);
  const { calculator: content } = useIntlayer("traits");

  if (!specTraits) {
    return (
      <Flex align="center" justify="center" h="100vh">
        <Loader size="lg" />
      </Flex>
    );
  }

  return (
    <Flex flexDirection="column" h="100vh" overflow="hidden">
      <header className={headerStyles}>
        <UITooltip content={content.close}>
          <IconButton variant="plain" size="sm" asChild>
            <Link href={routes.plan.traits.path}>
              <X size={16} />
            </Link>
          </IconButton>
        </UITooltip>
        <HStack gap="2">
          <span className={titleStyles}>{specTraits.spec_name}</span>
          <span className={subtitleStyles}>{specTraits.class_name}</span>
        </HStack>
      </header>

      <TraitCanvas specTraits={specTraits} />
    </Flex>
  );
}
