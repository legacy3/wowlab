"use client";

import { X } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { Flex, HStack } from "styled-system/jsx";

import { SpecPicker } from "@/components/game";
import { IconButton, Link, Loader, Tooltip } from "@/components/ui";
import { routes } from "@/lib/routing";
import { useSpecTraits } from "@/lib/state";

import { TraitCanvas } from "./canvas";

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
      <HStack
        gap="3"
        h="12"
        px="3"
        bg="bg.default"
        borderBottomWidth="1"
        borderColor="border.default"
      >
        <Tooltip content={content.close}>
          <IconButton variant="plain" size="sm" asChild>
            <Link href={routes.plan.traits.path}>
              <X size={16} />
            </Link>
          </IconButton>
        </Tooltip>
        <SpecPicker compact specId={specId} onSelect={() => {}} />
      </HStack>

      <TraitCanvas specTraits={specTraits} />
    </Flex>
  );
}
