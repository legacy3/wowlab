"use client";

import { DotIcon } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { css, cx } from "styled-system/css";
import { Flex, styled } from "styled-system/jsx";

import type { Slot } from "@/lib/sim";

import { GameIcon, ItemTooltip } from "@/components/game";
import { Skeleton, Text, Tooltip } from "@/components/ui";
import { useItem } from "@/lib/state";

type EquipmentSlotContent = ReturnType<
  typeof useIntlayer<"simulate">
>["equipmentSlot"];

function getSlotLabel(slot: Slot, content: EquipmentSlotContent): string {
  switch (slot) {
    case "back":
      return content.back;

    case "chest":
      return content.chest;

    case "feet":
      return content.feet;

    case "finger1":
      return content.finger({ n: 1 });

    case "finger2":
      return content.finger({ n: 2 });

    case "hands":
      return content.hands;

    case "head":
      return content.head;

    case "legs":
      return content.legs;

    case "main_hand":
      return content.mainHand;

    case "neck":
      return content.neck;

    case "off_hand":
      return content.offHand;

    case "shoulder":
      return content.shoulder;

    case "trinket1":
      return content.trinket({ n: 1 });

    case "trinket2":
      return content.trinket({ n: 2 });

    case "waist":
      return content.waist;

    case "wrist":
      return content.wrist;
  }
}

const slotStyles = css({
  _hover: {
    borderColor: "gray.7",
  },
  alignItems: "center",
  bg: "gray.2",
  borderColor: "gray.6",
  borderRadius: "l2",
  borderWidth: "1px",
  display: "flex",
  gap: "3",
  overflow: "hidden",
  p: "2",
  transition: "colors",
});

const emptyIconStyles = css({
  alignItems: "center",
  bg: "gray.3",
  borderColor: "gray.6",
  borderRadius: "sm",
  borderStyle: "dashed",
  borderWidth: "2px",
  color: "fg.muted",
  display: "flex",
  flexShrink: 0,
  fontSize: "xs",
  h: "10",
  justifyContent: "center",
  w: "10",
});

const iconWrapperStyles = css({
  borderColor: "gray.7",
  borderRadius: "sm",
  borderWidth: "1px",
  flexShrink: 0,
  h: "10",
  overflow: "hidden",
  w: "10",
});

export interface EquipmentSlotProps {
  align?: "left" | "right";
  className?: string;
  itemId: number | null;
  slot: Slot;
}

export function EquipmentSlot({
  align = "left",
  className,
  itemId,
  slot,
}: EquipmentSlotProps) {
  const { equipmentSlot: content } = useIntlayer("simulate");
  const { data: item, isLoading } = useItem(itemId);
  const slotLabel = getSlotLabel(slot, content);
  const isRight = align === "right";

  if (isLoading && itemId) {
    return (
      <div className={cx(slotStyles, className)}>
        {isRight ? (
          <>
            <LoadingContent align="right" />
            <Skeleton h="10" w="10" borderRadius="sm" />
          </>
        ) : (
          <>
            <Skeleton h="10" w="10" borderRadius="sm" />
            <LoadingContent align="left" />
          </>
        )}
      </div>
    );
  }

  const icon = item ? (
    <div className={iconWrapperStyles}>
      <GameIcon
        iconName={item.file_name ?? "inv_misc_questionmark"}
        size="md"
        alt={item.name}
      />
    </div>
  ) : (
    <div className={emptyIconStyles}>—</div>
  );

  const ilvlText = content.ilvl({ ilvl: item?.item_level ?? 0 });

  const itemContent = item ? (
    <ItemTooltip
      item={{
        iconName: item.file_name,
        itemLevel: item.item_level ?? 0,
        name: item.name,
        quality: item.quality ?? 1,
        slot: slotLabel,
      }}
    >
      <Flex
        direction="column"
        gap="0.5"
        minW="0"
        flex="1"
        alignItems={isRight ? "flex-end" : "flex-start"}
        cursor="pointer"
      >
        <Tooltip
          content={item.name}
          positioning={{ placement: isRight ? "left" : "right" }}
        >
          <Text
            textStyle="sm"
            fontWeight="medium"
            truncate
            w="full"
            style={{ color: getQualityColor(item.quality ?? 1) }}
          >
            {item.name}
          </Text>
        </Tooltip>
        <Text
          textStyle="xs"
          color="fg.muted"
          display="flex"
          alignItems="center"
        >
          {isRight ? (
            <>
              {slotLabel}
              <DotIcon size={12} />
              {ilvlText}
            </>
          ) : (
            <>
              {ilvlText}
              <DotIcon size={12} />
              {slotLabel}
            </>
          )}
        </Text>
      </Flex>
    </ItemTooltip>
  ) : (
    <Flex
      direction="column"
      gap="0.5"
      minW="0"
      flex="1"
      alignItems={isRight ? "flex-end" : "flex-start"}
    >
      <Text textStyle="sm" color="fg.muted" fontStyle="italic">
        {content.empty}
      </Text>
      <Text textStyle="xs" color="fg.subtle">
        {slotLabel}
      </Text>
    </Flex>
  );

  return (
    <div className={cx(slotStyles, className)}>
      {isRight ? (
        <>
          {itemContent}
          {icon}
        </>
      ) : (
        <>
          {icon}
          {itemContent}
        </>
      )}
    </div>
  );
}

function getQualityColor(quality: number): string {
  const colors: Record<number, string> = {
    0: "#9d9d9d", // Poor
    1: "#ffffff", // Common
    2: "#1eff00", // Uncommon
    3: "#0070dd", // Rare
    4: "#a335ee", // Epic
    5: "#ff8000", // Legendary
    6: "#e6cc80", // Artifact
    7: "#00ccff", // Heirloom
  };
  return colors[quality] ?? "#ffffff";
}

function LoadingContent({ align }: { align: "left" | "right" }) {
  const isRight = align === "right";
  return (
    <styled.div
      display="flex"
      flexDir="column"
      gap="1"
      flex="1"
      alignItems={isRight ? "flex-end" : "flex-start"}
    >
      <Skeleton h="4" w="24" />
      <Skeleton h="3" w="16" />
    </styled.div>
  );
}
