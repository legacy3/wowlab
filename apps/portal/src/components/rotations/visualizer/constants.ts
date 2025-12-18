// Row dimensions
export const ROW_HEIGHT = 56;
export const ROW_GAP = 8;
export const HEADER_HEIGHT = 40;
export const PADDING = 16;

// Priority badge
export const BADGE_SIZE = 24;
export const BADGE_CORNER_RADIUS = 6;

// Spell icon
export const ICON_SIZE = 36;
export const ICON_CORNER_RADIUS = 4;

// Spacing between elements
export const BADGE_TO_ICON_GAP = 12;
export const ICON_TO_TEXT_GAP = 12;
export const TEXT_TO_STATUS_GAP = 16;
export const STATUS_TO_CHEVRON_GAP = 12;

// Status and chevron
export const STATUS_WIDTH = 80;
export const CHEVRON_SIZE = 14;
export const CHEVRON_STROKE_WIDTH = 2.5;

// Text
export const NAME_FONT_SIZE = 14;
export const CONDITION_FONT_SIZE = 12;
export const STATUS_FONT_SIZE = 12;
export const BADGE_FONT_SIZE = 12;
export const HEADER_FONT_SIZE = 14;

// Visual styling
export const ROW_CORNER_RADIUS = 8;

// Colors
export const COLOR_BG_DEFAULT = "#0c0c0d";
export const COLOR_BG_CAST = "#22c55e12";
export const COLOR_BORDER_DEFAULT = "#1f1f23";
export const COLOR_BORDER_CAST = "#22c55e";
export const COLOR_TEXT_NAME = "#a1a1aa";
export const COLOR_TEXT_NAME_CAST = "#f4f4f5";
export const COLOR_TEXT_CONDITION = "#52525b";
export const COLOR_TEXT_STATUS = "#3f3f46";
export const COLOR_TEXT_CAST = "#22c55e";
export const COLOR_HEADER = "#71717a";

// Opacity
export const OPACITY_CAST = 1;
export const OPACITY_SKIPPED = 0.45;
export const OPACITY_DEFAULT = 0.65;

// Layout calculations
export function getRowLayout(width: number) {
  const contentWidth = width - PADDING * 2;

  // Left side: badge -> icon -> text
  const badgeX = PADDING;
  const iconX = badgeX + BADGE_SIZE + BADGE_TO_ICON_GAP;
  const textX = iconX + ICON_SIZE + ICON_TO_TEXT_GAP;

  // Right side: chevron <- status (work backwards from right edge)
  const chevronX = contentWidth - CHEVRON_SIZE;
  const statusX = chevronX - STATUS_TO_CHEVRON_GAP - STATUS_WIDTH;

  // Available width for text (between textX and statusX)
  const textMaxWidth = statusX - textX - TEXT_TO_STATUS_GAP;

  // Vertical positions
  const badgeY = (ROW_HEIGHT - BADGE_SIZE) / 2;
  const iconY = (ROW_HEIGHT - ICON_SIZE) / 2;
  const nameY = ROW_HEIGHT / 2 - 10;
  const conditionY = ROW_HEIGHT / 2 + 6;
  const chevronY = ROW_HEIGHT / 2;

  return {
    // X positions
    badgeX,
    iconX,
    textX,
    statusX,
    statusWidth: STATUS_WIDTH,
    chevronX,
    textMaxWidth,
    contentWidth,

    // Y positions
    badgeY,
    iconY,
    nameY,
    conditionY,
    chevronY,
  };
}

export function calculateCanvasHeight(rowCount: number): number {
  return (
    rowCount * (ROW_HEIGHT + ROW_GAP) - ROW_GAP + HEADER_HEIGHT + PADDING * 2
  );
}

export function getRowY(index: number): number {
  return index * (ROW_HEIGHT + ROW_GAP);
}
