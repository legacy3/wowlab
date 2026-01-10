import type { NavItem } from "@/lib/content/types";

import { createNavItem } from "@/lib/content";

import type { Doc, DocEntry } from "./types";

import { development, guides, overview, reference } from "./sections";

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

export function getFirstSlug(): string {
  return docSlugs[0] ?? "00-overview";
}

export function getNavMeta(slug: string): NavItem {
  const doc = docs[slug];
  if (!doc) {
    return null;
  }

  return createNavItem(slug, doc.meta.title, "/docs");
}
