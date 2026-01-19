// =============================================================================
// Shared Theme - Base colors for all canvas components
// =============================================================================

export const THEME = {
  // Backgrounds
  bg: "#09090b",
  bgElevated: "#111113",
  bgMuted: "#18181b",

  // Text
  text: "#a1a1aa",
  textBright: "#fafafa",
  textMuted: "#71717a",

  // Borders
  border: "#27272a",
  borderMuted: "#1f1f23",

  // Accent (selection, playhead, highlights)
  accent: "#facc15",
  accentGlow: "rgba(250, 204, 21, 0.2)",

  // Status colors
  error: "#ef4444",
  info: "#3b82f6",
  success: "#22c55e",
  warning: "#f97316",
} as const;

export type Theme = typeof THEME;
