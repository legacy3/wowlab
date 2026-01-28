"use client";

import { useIntlayer } from "next-intlayer";
import { css, cx } from "styled-system/css";

import { SpellDescription } from "@/components/game";

import type { TooltipData } from "../renderer/types";

import { COLORS } from "../renderer/constants";

const tooltipStyles = css({
  bg: "gray.900/98",
  border: "1px solid",
  borderColor: "gray.700",
  borderRadius: "lg",
  boxShadow: "xl",
  color: "gray.100",
  fontSize: "sm",
  lineHeight: "relaxed",
  maxW: "300px",
  p: "3",
  pointerEvents: "none",
  position: "absolute",
  zIndex: 100,
});

const titleStyles = css({
  fontWeight: "semibold",
  mb: "1",
});

const descriptionStyles = css({
  color: "gray.400",
  fontFamily: "mono",
  fontSize: "xs",
  whiteSpace: "pre-wrap",
});

const rankStyles = css({
  color: "gray.500",
  fontSize: "xs",
  mt: "2",
});

const rankActiveStyles = css({
  color: "success.500",
});

const rankMaxedStyles = css({
  color: "warning.500",
});

const hintStyles = css({
  borderColor: "gray.700",
  borderTop: "1px solid",
  color: "gray.500",
  fontSize: "xs",
  mt: "2",
  pt: "2",
});

export interface TraitTooltipProps {
  data: TooltipData;
}

export function TraitTooltip({ data }: TraitTooltipProps) {
  const entry = data.node.entries[data.entryIndex];
  const { tooltip: content } = useIntlayer("traits");

  if (!entry) {
    return null;
  }

  const isActive = data.ranksPurchased > 0;
  const isMaxed = data.ranksPurchased >= data.node.maxRanks;

  return (
    <div
      className={tooltipStyles}
      style={{
        left: data.screenX + 10,
        top: data.screenY,
      }}
    >
      <div className={titleStyles} style={{ color: COLORS.selectionRing }}>
        {entry.name}
      </div>
      <SpellDescription
        className={descriptionStyles}
        description={entry.description}
        spellId={entry.spellId}
      />
      {data.node.maxRanks > 1 && (
        <div
          className={cx(
            rankStyles,
            isMaxed ? rankMaxedStyles : isActive ? rankActiveStyles : undefined,
          )}
        >
          {content.rank}: {data.ranksPurchased}/{data.node.maxRanks}
        </div>
      )}
      <div className={hintStyles}>
        {isMaxed
          ? content.rightClickToRefund
          : isActive
            ? content.clickToAddRank
            : content.clickToPurchase}
      </div>
    </div>
  );
}
