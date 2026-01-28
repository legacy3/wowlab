import type { TocEntry } from "./types";

export type TocHeading = {
  id: string;
  text: string;
  level: number;
};

export function flattenToc(
  entries: TocEntry[],
  level = 2,
  result: TocHeading[] = [],
): TocHeading[] {
  for (const entry of entries) {
    // Velite URLs are like "#heading-id", extract the id
    const id = entry.url.startsWith("#") ? entry.url.slice(1) : entry.url;

    if (id && level >= 2) {
      result.push({
        id,
        level,
        text: entry.title,
      });
    }

    if (entry.items && entry.items.length > 0) {
      flattenToc(entry.items, level + 1, result);
    }
  }

  return result;
}
