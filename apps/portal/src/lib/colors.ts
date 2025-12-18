/**
 * Shared color palette based on Tailwind colors.
 * Use these for Konva canvas and anywhere else needing raw hex values.
 */
import colors from "tailwindcss/colors";

// Semantic
export const success = colors.green[500];
export const successMuted = `${colors.green[500]}12`; // 7% opacity
export const error = colors.red[500];
export const warning = colors.amber[500];
export const primary = colors.blue[500];
export const gold = colors.yellow[400];

// Grayscale (zinc scale for dark mode)
export const bgDark = colors.zinc[950];
export const bgCard = "#0c0c0d"; // slightly off from zinc
export const bgElevated = colors.zinc[900];
export const bgActive = "#18181b"; // slightly lighter for active/selected states
export const bgMuted = colors.gray[800];
export const borderDefault = "#1f1f23";
export const borderSubtle = colors.zinc[800];
export const borderMuted = colors.gray[600];
export const textDefault = colors.zinc[200];
export const textBright = colors.zinc[100];
export const textMuted = colors.zinc[400];
export const textSubtle = colors.zinc[500];
export const textDim = colors.zinc[600];
export const textDisabled = colors.zinc[700];

// Grid / decorative
export const grid = "#1a1a1a";
export const gridLine = "#333";

// Pure
export const white = colors.white;
export const black = colors.black;
