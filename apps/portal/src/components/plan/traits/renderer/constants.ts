import { THEME } from "@/components/fabric";

// Node Sizes
export const NODE_SIZE = 40;
export const CHOICE_NODE_SIZE = 44;
export const NODE_BORDER = 3;
export const NODE_CORNER_RADIUS = 4;
export const CHOICE_CORNER_RADIUS = 6;
export const CELL_SIZE = 48;

// Zoom
export const MIN_ZOOM = 0.3;
export const MAX_ZOOM = 3;

// Edge Widths
export const EDGE_WIDTH_ACTIVE = 2.5;
export const EDGE_WIDTH_UNLOCKED = 1.5;
export const EDGE_WIDTH_LOCKED = 1;

// Edge Dash Patterns
export const EDGE_DASH_LOCKED = [4, 4];
export const EDGE_DASH_UNLOCKED: number[] = [];
export const EDGE_DASH_ACTIVE: number[] = [];

// Colors
export const COLORS = {
  // Backgrounds
  bg: THEME.bg,
  nodeBg: "#1f2937",
  nodeBgChoice: "#1e1b4b",
  nodeBgFallback: "#374151",

  // Node borders by state
  borderActive: THEME.accent,
  borderLocked: "#4b5563",
  borderMaxed: THEME.warning,
  borderUnlocked: THEME.success,

  // Special node borders
  borderChoice: THEME.info,
  borderHero: THEME.warning,

  // Edge colors by state
  edgeActive: THEME.accent,
  edgeLocked: "#4b5563",
  edgeUnlocked: THEME.success,

  // Selection and highlight
  focusRing: THEME.info,
  pathHighlight: THEME.success,
  pathTarget: "#f59e0b",
  searchHighlight: THEME.info,
  selectionRing: THEME.accent,

  // Rank badge
  rankBg: THEME.bg,
  rankStroke: THEME.border,
  rankTextDefault: THEME.text,
  rankTextMaxed: THEME.warning,
  rankTextSelected: THEME.success,

  // Text
  text: THEME.textBright,
  textMuted: THEME.text,

  // Misc
  accent: THEME.accent,
  blocked: THEME.error,
  border: THEME.border,
  divider: "#4b5563",
} as const;
