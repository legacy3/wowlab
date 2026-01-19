import { THEME } from "@/components/fabric";

// =============================================================================
// Layout
// =============================================================================

export const NODE_SIZE = 40;
export const CHOICE_NODE_SIZE = 44;
export const NODE_BORDER = 3;
export const NODE_CORNER_RADIUS = 4;
export const CHOICE_CORNER_RADIUS = 6;
export const CELL_SIZE = 48;

export const MIN_ZOOM = 0.3;
export const MAX_ZOOM = 3;

// =============================================================================
// Edge Styles
// =============================================================================

export const EDGE_WIDTH_ACTIVE = 2;
export const EDGE_WIDTH_UNLOCKED = 1.5;
export const EDGE_WIDTH_LOCKED = 1;

// =============================================================================
// Colors (extends shared theme)
// =============================================================================

export const COLORS = {
  // Base (from theme)
  bg: THEME.bg,
  text: THEME.textBright,
  textMuted: THEME.text,
  border: THEME.border,
  accent: THEME.accent,

  // Node backgrounds
  nodeBg: "#1f2937",
  nodeBgChoice: "#1e1b4b",
  nodeBgFallback: "#374151",

  // Node borders
  borderChoice: THEME.info,
  borderDefault: "#4b5563",
  borderHero: THEME.warning,
  borderSelected: THEME.accent,

  // Edges
  edgeActive: THEME.accent,
  edgeLocked: "#4b5563",
  edgeUnlocked: THEME.success,

  // Highlights
  blocked: THEME.error,
  focusRing: THEME.info,
  pathHighlight: THEME.success,
  pathTarget: "#f59e0b",
  searchHighlight: THEME.info,
  selectionRing: THEME.accent,

  // Rank badge
  rankBg: THEME.bg,
  rankStroke: THEME.border,
  rankTextDefault: THEME.text,
  rankTextSelected: THEME.success,

  // Misc
  divider: "#4b5563",
} as const;
