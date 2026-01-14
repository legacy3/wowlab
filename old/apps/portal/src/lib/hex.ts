export type RgbColor = {
  r: number;
  g: number;
  b: number;
};

export function formatHex(value: number, width = 8): string {
  return `0x${value.toString(16).toUpperCase().padStart(width, "0")}`;
}

export function parseHexColor(hex: string): RgbColor {
  const normalized = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return { r: 0, g: 0, b: 0 };
  }

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

export function parseHexColorNormalized(hex: string): RgbColor {
  const { r, g, b } = parseHexColor(hex);
  return { r: r / 255, g: g / 255, b: b / 255 };
}
