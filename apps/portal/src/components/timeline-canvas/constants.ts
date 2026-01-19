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
  accent: THEME.accent,
  accentGlow: THEME.accentGlow,
  bg: THEME.bg,
  border: THEME.border,
  text: THEME.text,
  textBright: THEME.textBright,

  // Timeline-specific
  gridLine: THEME.borderMuted,
  gridLineMajor: THEME.border,
  headerBg: THEME.bgElevated,
  tickMark: "#3f3f46",
  trackBg: "#131316",
  trackBgAlt: "#16161a",
} as const;
