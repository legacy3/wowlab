import { css } from "styled-system/css";

import type { TooltipData } from "../types";

import { COLORS } from "../constants";

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
  color: "accent.500",
  fontWeight: "semibold",
  mb: "1",
});

const descriptionStyles = css({
  "& em": {
    color: "yellow.400",
    fontStyle: "normal",
  },
  color: "gray.400",
});

const rankStyles = css({
  color: "gray.500",
  fontSize: "xs",
  mt: "1",
});

export interface TalentTooltipProps {
  data: TooltipData;
}

export function TalentTooltip({ data }: TalentTooltipProps) {
  const entry = data.node.entries[data.entryIndex];
  if (!entry) return null;

  // Parse description: replace $variables and |cXXXXXXXX color codes
  const parsedDescription = entry.description
    .replace(/\$\w+/g, "<em>X</em>")
    .replace(/\|c[a-f0-9]{8}([^|]+)\|r/gi, "<em>$1</em>");

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
      <div
        className={descriptionStyles}
        dangerouslySetInnerHTML={{ __html: parsedDescription }}
      />
      {data.node.maxRanks > 1 && (
        <div className={rankStyles}>Rank: 0/{data.node.maxRanks}</div>
      )}
    </div>
  );
}
