import type { Doc, DocEntry } from "./types";

export type DocPage = {
  slug: string;
  doc: Doc;
};

export function defineDocsSection(options: {
  group?: { slug: string; title: string };
  pages: readonly DocPage[];
}): { docs: Record<string, Doc>; index: DocEntry[] } {
  const docs: Record<string, Doc> = {};
  const entries: DocEntry[] = [];

  for (const page of options.pages) {
    if (docs[page.slug]) {
      throw new Error(`Duplicate doc slug "${page.slug}" within a section.`);
    }

    docs[page.slug] = page.doc;
    entries.push(docEntry(page.slug, page.doc));
  }

  if (options.group) {
    return {
      docs,
      index: [docGroup(options.group.slug, options.group.title, entries)],
    };
  }

  return { docs, index: entries };
}

export function docPage(slug: string, doc: Doc): DocPage {
  return { doc, slug };
}

function docEntry(slug: string, doc: Doc): DocEntry {
  return { slug, ...doc.meta };
}

function docGroup(slug: string, title: string, children: DocEntry[]): DocEntry {
  return { children, slug, title };
}
