export function formatGearSlotName(slot: string): string {
  const withSpacing = slot.replace(/([A-Z])/g, " $1").replace(/(\d+)/g, " $1");

  const capitalized = withSpacing.replace(/^./, (character) =>
    character.toUpperCase(),
  );

  return capitalized.trim();
}
