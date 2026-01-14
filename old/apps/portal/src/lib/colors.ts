import colors from "tailwindcss/colors";

// TODO Remove hardcoded colors to support theming

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

// WoW Class Colors
// TODO Get this from dbc data
export const CLASS_COLORS: Record<string, string> = {
  "Death Knight": "#C41E3A",
  "Demon Hunter": "#A330C9",
  Druid: "#FF7D0A",
  Evoker: "#33937F",
  Hunter: "#ABD473",
  Mage: "#69CCF0",
  Monk: "#00FF96",
  Paladin: "#F58CBA",
  Priest: "#FFFFFF",
  Rogue: "#FFF569",
  Shaman: "#0070DE",
  Warlock: "#9482C9",
  Warrior: "#C79C6E",
};

/** Class colors keyed by kebab-case ID (e.g., "death-knight", "demon-hunter") */
export const CLASS_COLORS_BY_ID: Record<string, string> = {
  "death-knight": "#C41E3A",
  "demon-hunter": "#A330C9",
  druid: "#FF7D0A",
  evoker: "#33937F",
  hunter: "#ABD473",
  mage: "#69CCF0",
  monk: "#00FF96",
  paladin: "#F58CBA",
  priest: "#FFFFFF",
  rogue: "#FFF569",
  shaman: "#0070DE",
  warlock: "#9482C9",
  warrior: "#C79C6E",
};
