"use client";

import { DotIcon } from "lucide-react";
import { useExtracted } from "next-intl";
import { css, cx } from "styled-system/css";
import { Flex, styled } from "styled-system/jsx";

import type { EquipmentSlot as EquipmentSlotType } from "@/lib/sim";

import { GameIcon, ItemTooltip } from "@/components/game";
import { Skeleton, Text, Tooltip } from "@/components/ui";
import { useItem } from "@/lib/state";

function useSlotLabel(slot: EquipmentSlotType): string {
  const t = useExtracted();

  switch (slot) {
    case "back":
      return t("Back");

    case "chest":
      return t("Chest");

    case "feet":
      return t("Feet");

    case "finger1":
      return t("{n, plural, other {Finger #}}", { n: 1 });

    case "finger2":
      return t("{n, plural, other {Finger #}}", { n: 2 });

    case "hands":
      return t("Hands");

    case "head":
      return t("Head");

    case "legs":
      return t("Legs");

    case "mainHand":
      return t("Main Hand");

    case "neck":
      return t("Neck");

    case "offHand":
      return t("Off Hand");

    case "shoulder":
      return t("Shoulder");

    case "trinket1":
      return t("{n, plural, other {Trinket #}}", { n: 1 });

    case "trinket2":
      return t("{n, plural, other {Trinket #}}", { n: 2 });

    case "waist":
      return t("Waist");

    case "wrist":
      return t("Wrist");
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
  slot: EquipmentSlotType;
}

export function EquipmentSlot({
  align = "left",
  className,
  itemId,
  slot,
}: EquipmentSlotProps) {
  const t = useExtracted();
  const { data: item, isLoading } = useItem(itemId);
  const slotLabel = useSlotLabel(slot);
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
        iconName={item.fileName ?? "inv_misc_questionmark"}
        size="md"
        alt={item.name}
      />
    </div>
  ) : (
    <div className={emptyIconStyles}>—</div>
  );

  const content = item ? (
    <ItemTooltip
      item={{
        iconName: item.fileName,
        itemLevel: item.itemLevel ?? 0,
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
              {t("iLvl {ilvl, plural, other {#}}", { ilvl: item.itemLevel })}
            </>
          ) : (
            <>
              {t("iLvl {ilvl, plural, other {#}}", { ilvl: item.itemLevel })}
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
        {t("Empty")}
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
          {content}
          {icon}
        </>
      ) : (
        <>
          {icon}
          {content}
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
