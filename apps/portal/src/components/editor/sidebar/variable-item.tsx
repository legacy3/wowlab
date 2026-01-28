"use client";

import { VariableIcon } from "lucide-react";
import { Flex, HStack, VStack } from "styled-system/jsx";

import type { Variable } from "@/lib/editor";

import { Badge, Text } from "@/components/ui";

import { EditDeleteMenu } from "../common";

interface VariableItemProps {
  onDelete: () => void;
  onEdit: () => void;
  variable: Variable;
}

export function VariableItem({
  onDelete,
  onEdit,
  variable,
}: VariableItemProps) {
  return (
    <Flex
      align="center"
      justify="space-between"
      px="2"
      py="1.5"
      rounded="md"
      cursor="pointer"
      _hover={{ bg: "bg.subtle" }}
      onClick={onEdit}
    >
      <HStack gap="2" flex="1" minW="0">
        <VariableIcon size={14} />
        <VStack gap="0" alignItems="start" flex="1" minW="0">
          <Badge size="sm" variant="subtle" fontFamily="mono">
            ${variable.name}
          </Badge>
          <Text
            textStyle="xs"
            color="fg.muted"
            fontFamily="mono"
            truncate
            w="full"
          >
            {variable.expression || "(no expression)"}
          </Text>
        </VStack>
      </HStack>

      <EditDeleteMenu
        onEdit={onEdit}
        onDelete={onDelete}
        ariaLabel="Variable actions"
      />
    </Flex>
  );
}

export type { VariableItemProps };
