import {
  bgActive,
  borderMuted,
  error,
  gold,
  primary,
  gridLine,
  success,
  textDim,
  textMuted,
  warning,
  white,
} from "@/lib/colors";

export const NODE_SIZE = 40;
export const CHOICE_NODE_SIZE = 44;
export const NODE_BORDER = 3;
export const NODE_CORNER_RADIUS = 20;
export const CHOICE_CORNER_RADIUS = 6;
export const HERO_CORNER_RADIUS = 6;

export const EDGE_WIDTH_ACTIVE = 2;
export const EDGE_WIDTH_UNLOCKED = 1.5;
export const EDGE_WIDTH_LOCKED = 1;
export const EDGE_COLOR_ACTIVE = gold;
export const EDGE_COLOR_UNLOCKED = success;
export const EDGE_COLOR_LOCKED = borderMuted;

export const PADDING = 30;
export const MIN_SCALE = 0.3;
export const MAX_SCALE = 3;

export const COLOR_SELECTED_RING = gold;
export const COLOR_PATH_HIGHLIGHT = success;
export const COLOR_PATH_TARGET = warning;
export const COLOR_HERO_BORDER = warning;
export const COLOR_CHOICE_BORDER = primary;
export const COLOR_DEFAULT_BORDER = borderMuted;
export const COLOR_RANK_BG = bgActive;
export const COLOR_RANK_SELECTED = success;
export const COLOR_RANK_DEFAULT = textMuted;
export const COLOR_BLOCKED = error;
export const COLOR_KEYBOARD_FOCUS = primary;
export const COLOR_SEARCH_HIGHLIGHT = primary;
export const COLOR_NODE_BG = "#1f2937";
export const COLOR_NODE_BG_CHOICE = "#1e1b4b";
export const COLOR_NODE_BG_FALLBACK = "#374151";
export const COLOR_NODE_DIVIDER = "#4b5563";
export const COLOR_NODE_SELECTED_BORDER = "#eab308";
export const COLOR_RANK_STROKE = "#27272a";
export const COLOR_HERE_ARROW = white;
export const COLOR_HERE_ARROW_GLOW = primary;
export const GRID_COLOR = `${gridLine}26`;

export const PREVIEW_BG = "#0a0a0b";
export const PREVIEW_EDGE = textDim;
export const PREVIEW_EDGE_ACTIVE = success;
export const PREVIEW_NODE = textDim;
export const PREVIEW_NODE_ACTIVE = success;
export const PREVIEW_NODE_ACTIVE_STROKE = "#22c55e80";
