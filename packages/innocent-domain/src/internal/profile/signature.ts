const dimensionPriority = (id: string): number => {
  if (id.startsWith("player-")) return 0;
  if (id.startsWith("shared-")) return 1;
  if (id.startsWith("race-")) return 2;
  if (id.startsWith("class-")) return 3;
  if (id.startsWith("spec-")) return 4;
  return 5;
};

export const normalizeProfileIds = (
  profileIds: ReadonlyArray<string>,
): readonly string[] =>
  Array.from(new Set(profileIds)).sort((left, right) => {
    const priority = dimensionPriority(left) - dimensionPriority(right);
    if (priority !== 0) {
      return priority;
    }
    return left.localeCompare(right);
  });

export const profileSignature = (profileIds: ReadonlyArray<string>): string =>
  normalizeProfileIds(profileIds).join("|");
