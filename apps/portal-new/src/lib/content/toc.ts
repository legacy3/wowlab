import type { TocEntry } from "./types";

export type TocHeading = {
  id: string;
  text: string;
  level: number;
};

export function flattenToc(
  entries: TocEntry[],
  result: TocHeading[] = [],
): TocHeading[] {
  for (const entry of entries) {
    if (entry.id && entry.depth >= 2) {
      result.push({
        id: entry.id,
        level: entry.depth,
        text: entry.value,
      });
    }

    if (entry.children) {
      flattenToc(entry.children, result);
    }
  }

  return result;
}
