import { development } from "./section.development";
import { guides } from "./section.guides";
import { overview } from "./section.overview";
import { reference } from "./section.reference";

import type { Doc, DocEntry } from "./types";
export type { Doc, DocEntry, DocMeta } from "./types";

function mergeDocs(parts: Array<Record<string, Doc>>): Record<string, Doc> {
  const merged: Record<string, Doc> = {};

  for (const part of parts) {
    for (const [slug, doc] of Object.entries(part)) {
      if (merged[slug]) {
        throw new Error(
          `Duplicate doc slug "${slug}". Check your lib/docs/section.* modules.`,
        );
      }

      merged[slug] = doc;
    }
  }

  return merged;
}

export const docs: Record<string, Doc> = mergeDocs([
  overview.docs,
  guides.docs,
  reference.docs,
  development.docs,
]);

export const docsIndex: DocEntry[] = [
  ...overview.index,
  ...guides.index,
  ...reference.index,
  ...development.index,
];

function flattenSlugs(entries: DocEntry[]): string[] {
  return entries.flatMap((entry) => {
    if (entry.children) {
      return flattenSlugs(entry.children);
    }

    return [entry.slug];
  });
}

export const docSlugs = flattenSlugs(docsIndex);

export function getDoc(slug: string): Doc | undefined {
  return docs[slug];
}

export function getNavMeta(slug: string) {
  const doc = docs[slug];
  if (!doc) {
    return null;
  }

  return { slug, title: doc.meta.title, href: `/docs/${slug}` };
}
