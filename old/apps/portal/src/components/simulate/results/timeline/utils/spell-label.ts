export interface SpellLabelResult {
  text: string;
  showFullName: boolean;
  fontSize: number;
}

export function getSpellLabel(
  spellName: string,
  availableWidth: number,
  options: {
    charWidth?: number;
    fullNameFontSize?: number;
    initialsFontSize?: number;
    maxInitials?: number;
  } = {},
): SpellLabelResult {
  const {
    charWidth = 6,
    fullNameFontSize = 10,
    initialsFontSize = 9,
    maxInitials = 3,
  } = options;

  const nameWidth = spellName.length * charWidth;
  const showFullName = availableWidth >= nameWidth;

  if (showFullName) {
    return {
      text: spellName,
      showFullName: true,
      fontSize: fullNameFontSize,
    };
  }

  const initials = spellName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, maxInitials);

  return {
    text: initials,
    showFullName: false,
    fontSize: initialsFontSize,
  };
}

export function shouldShowLabel(width: number, minWidth = 30): boolean {
  return width > minWidth;
}
