import * as fabric from "fabric";

import type { EdgeState } from "@/lib/trait";

import {
  COLORS,
  EDGE_DASH_ACTIVE,
  EDGE_DASH_LOCKED,
  EDGE_DASH_UNLOCKED,
  EDGE_WIDTH_ACTIVE,
  EDGE_WIDTH_LOCKED,
  EDGE_WIDTH_UNLOCKED,
} from "./constants";

interface EdgeStyle {
  color: string;
  dashPattern: number[];
  width: number;
}

export function createEdge(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  state: EdgeState,
): fabric.Line {
  const { color, dashPattern, width } = getEdgeStyle(state);

  return new fabric.Line([fromX, fromY, toX, toY], {
    evented: false,
    objectCaching: true,
    selectable: false,
    stroke: color,
    strokeDashArray: dashPattern,
    strokeWidth: width,
  });
}

function getEdgeStyle(state: EdgeState): EdgeStyle {
  switch (state) {
    case "active":
      return {
        color: COLORS.edgeActive,
        dashPattern: EDGE_DASH_ACTIVE,
        width: EDGE_WIDTH_ACTIVE,
      };
    case "unlocked":
      return {
        color: COLORS.edgeUnlocked,
        dashPattern: EDGE_DASH_UNLOCKED,
        width: EDGE_WIDTH_UNLOCKED,
      };
    case "locked":
    default:
      return {
        color: COLORS.edgeLocked,
        dashPattern: EDGE_DASH_LOCKED,
        width: EDGE_WIDTH_LOCKED,
      };
  }
}
