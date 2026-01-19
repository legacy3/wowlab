import { THEME } from "@/components/fabric";

// =============================================================================
// Layout Constants
// =============================================================================

export const TRACK_HEIGHT = 52;
export const TRACK_GAP = 1;
export const HEADER_WIDTH = 120;
export const TIME_HEADER_HEIGHT = 32;
export const PIXELS_PER_SECOND = 80;
export const EVENT_PADDING = 8;
export const EVENT_CORNER_RADIUS = 4;

// =============================================================================
// Colors (extends shared theme)
// =============================================================================

export const COLORS = {
  // Base (from theme)
  bg: THEME.bg,
  text: THEME.text,
  textBright: THEME.textBright,
  border: THEME.border,
  accent: THEME.accent,
  accentGlow: THEME.accentGlow,

  // Timeline-specific
  headerBg: THEME.bgElevated,
  trackBg: "#131316",
  trackBgAlt: "#16161a",
  gridLine: THEME.borderMuted,
  gridLineMajor: THEME.border,
  tickMark: "#3f3f46",
} as const;
