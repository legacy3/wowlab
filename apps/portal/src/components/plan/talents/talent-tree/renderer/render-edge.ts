import * as fabric from "fabric";

import { COLORS, EDGE_WIDTH_LOCKED } from "../constants";

/**
 * Create an edge (connection line) between two nodes.
 */
export function createEdge(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): fabric.Line {
  return new fabric.Line([fromX, fromY, toX, toY], {
    evented: false,
    objectCaching: true,
    selectable: false,
    stroke: COLORS.edgeLocked,
    strokeWidth: EDGE_WIDTH_LOCKED,
  });
}
