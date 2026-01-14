import type { TalentNodePosition } from "@wowlab/services/Talents";

export interface TooltipState {
  x: number;
  y: number;
  node: TalentNodePosition["node"];
  selection?: TalentNodePosition["selection"];
}
