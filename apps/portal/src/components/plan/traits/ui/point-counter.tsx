"use client";

import { useIntlayer } from "next-intlayer";
import { memo } from "react";
import { css, cx } from "styled-system/css";
import { HStack, VStack } from "styled-system/jsx";

import { usePointCounts } from "@/lib/state/traits";

const containerStyles = css({
  backdropFilter: "blur(8px)",
  bg: "bg.default/95",
  border: "1px solid",
  borderColor: "border.default",
  borderRadius: "lg",
  boxShadow: "lg",
  p: "2",
});

const labelStyles = css({
  color: "fg.muted",
  fontSize: "xs",
  fontWeight: "medium",
});

const valueStyles = css({
  fontFamily: "mono",
  fontSize: "sm",
  fontWeight: "semibold",
});

const valueMaxedStyles = css({
  color: "warning.500",
});

const valueActiveStyles = css({
  color: "success.500",
});

const valueDefaultStyles = css({
  color: "fg.default",
});

interface PointItemProps {
  current: number;
  label: string;
  max: number;
}

function PointItem({ current, label, max }: PointItemProps) {
  const isMaxed = current >= max;
  const isActive = current > 0;

  const valueColorClass = isMaxed
    ? valueMaxedStyles
    : isActive
      ? valueActiveStyles
      : valueDefaultStyles;

  return (
    <VStack gap="0">
      <span className={labelStyles}>{label}</span>
      <span className={cx(valueStyles, valueColorClass)}>
        {current}/{max}
      </span>
    </VStack>
  );
}

export const PointCounter = memo(function PointCounter() {
  const { classPoints, classPointsLimit, heroPoints, heroPointsLimit } =
    usePointCounts();
  const { pointCounter: content } = useIntlayer("traits");

  return (
    <div className={containerStyles}>
      <HStack gap="4">
        <PointItem
          label={content.class}
          current={classPoints}
          max={classPointsLimit}
        />
        <PointItem
          label={content.hero}
          current={heroPoints}
          max={heroPointsLimit}
        />
      </HStack>
    </div>
  );
});
