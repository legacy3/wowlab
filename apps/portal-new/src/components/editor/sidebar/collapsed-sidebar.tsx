"use client";

import { ChevronRightIcon, ListIcon, VariableIcon } from "lucide-react";
import { useExtracted } from "next-intl";
import { Flex, VStack } from "styled-system/jsx";

import { Badge, IconButton, Tooltip } from "@/components/ui";

interface CollapsedSidebarProps {
  activeTab: TabId;
  listCount: number;
  onExpand: () => void;
  onTabClick: (tab: TabId) => void;
  variableCount: number;
}

type TabId = "lists" | "variables";

export function CollapsedSidebar({
  activeTab,
  listCount,
  onExpand,
  onTabClick,
  variableCount,
}: CollapsedSidebarProps) {
  const t = useExtracted();

  return (
    <Flex
      direction="column"
      align="center"
      py="3"
      gap="1"
      borderRightWidth="1"
      borderColor="border.default"
      bg="bg.subtle"
      w="12"
    >
      <Tooltip
        content={t("Expand sidebar")}
        positioning={{ placement: "right" }}
      >
        <IconButton
          variant="plain"
          size="sm"
          onClick={onExpand}
          aria-label={t("Expand sidebar")}
        >
          <ChevronRightIcon size={16} />
        </IconButton>
      </Tooltip>

      <VStack gap="1" mt="2">
        <Tooltip
          content={t("Action Lists ({count})", { count: String(listCount) })}
          positioning={{ placement: "right" }}
        >
          <Flex
            direction="column"
            align="center"
            gap="0.5"
            p="1.5"
            rounded="md"
            cursor="pointer"
            bg={activeTab === "lists" ? "bg.muted" : "transparent"}
            _hover={{ bg: "bg.muted" }}
            onClick={() => onTabClick("lists")}
          >
            <ListIcon size={18} />
            <Badge size="sm" variant="subtle">
              {listCount}
            </Badge>
          </Flex>
        </Tooltip>

        <Tooltip
          content={t("Variables ({count})", { count: String(variableCount) })}
          positioning={{ placement: "right" }}
        >
          <Flex
            direction="column"
            align="center"
            gap="0.5"
            p="1.5"
            rounded="md"
            cursor="pointer"
            bg={activeTab === "variables" ? "bg.muted" : "transparent"}
            _hover={{ bg: "bg.muted" }}
            onClick={() => onTabClick("variables")}
          >
            <VariableIcon size={18} />
            <Badge size="sm" variant="subtle">
              {variableCount}
            </Badge>
          </Flex>
        </Tooltip>
      </VStack>
    </Flex>
  );
}

export type { TabId };
