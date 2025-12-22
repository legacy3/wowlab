import { black, white } from "@/lib/colors";

export const ANNOTATION_TEXT_DARK = black;
export const ANNOTATION_TEXT_LIGHT = white;

export const ANNOTATION_TEXT_BG = "rgba(12,12,14,0.82)";
export const ANNOTATION_BADGE_STROKE = "rgba(0,0,0,0.45)";
export const ANNOTATION_ANCHOR_STROKE = white;
export const ANNOTATION_HALO = "rgba(0,0,0,0.45)";
export const ANNOTATION_HANDLE_BG = "rgba(9,9,11,0.9)";

export const ANNOTATION_DEFAULT_STROKE_WIDTH = 3;
export const ANNOTATION_DEFAULT_OPACITY = 1;

export const ANNOTATION_HANDLE_RADIUS = 7;
export const ANNOTATION_HANDLE_STROKE_WIDTH = 2;

export const ANNOTATION_MIN_STROKE_WIDTH = 1;
export const ANNOTATION_MAX_STROKE_WIDTH = 8;

export const ARROW_DEFAULT_HEAD_LENGTH = 16;
export const ARROW_DEFAULT_HEAD_WIDTH = 10;

export const CIRCLE_MIN_RADIUS = 12;

export const TEXT_DEFAULT_FONT_SIZE = 15;
export const TEXT_DEFAULT_FONT_WEIGHT = 600;
export const TEXT_DEFAULT_PADDING = 8;
export const TEXT_MIN_WIDTH = 90;
export const TEXT_DEFAULT_WIDTH = 160;
export const TEXT_DEFAULT_RADIUS = 6;
export const TEXT_PLACEHOLDER = "Add note";

export const NUMBER_DEFAULT_SIZE = 30;
export const NUMBER_DEFAULT_FONT_SIZE = 14;

export const DASH_PATTERNS: Record<"solid" | "dashed" | "dotted", number[]> = {
  solid: [],
  dashed: [10, 6],
  dotted: [2, 6],
};

export function normalizeDash(dash?: number[] | null): number[] | undefined {
  if (!dash || dash.length === 0) {
    return undefined;
  }
  return dash;
}
