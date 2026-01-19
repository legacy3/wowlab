import { THEME } from "@/components/fabric";

export const NODE_SIZE = 40;
export const CHOICE_NODE_SIZE = 44;
export const NODE_BORDER = 3;
export const NODE_CORNER_RADIUS = 4;
export const CHOICE_CORNER_RADIUS = 6;
export const CELL_SIZE = 48;

export const MIN_ZOOM = 0.3;
export const MAX_ZOOM = 3;

export const EDGE_WIDTH_ACTIVE = 2;
export const EDGE_WIDTH_UNLOCKED = 1.5;
export const EDGE_WIDTH_LOCKED = 1;

export const COLORS = {
  accent: THEME.accent,
  bg: THEME.bg,
  blocked: THEME.error,
  border: THEME.border,
  borderChoice: THEME.info,

  borderDefault: "#4b5563",
  borderHero: THEME.warning,
  borderSelected: THEME.accent,

  divider: "#4b5563",
  edgeActive: THEME.accent,
  edgeLocked: "#4b5563",
  edgeUnlocked: THEME.success,

  focusRing: THEME.info,
  nodeBg: "#1f2937",
  nodeBgChoice: "#1e1b4b",

  nodeBgFallback: "#374151",
  pathHighlight: THEME.success,
  pathTarget: "#f59e0b",
  rankBg: THEME.bg,
  rankStroke: THEME.border,
  rankTextDefault: THEME.text,

  rankTextSelected: THEME.success,
  searchHighlight: THEME.info,
  selectionRing: THEME.accent,
  text: THEME.textBright,

  textMuted: THEME.text,
} as const;
