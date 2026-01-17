import { type Doc, docs as veliteDocs } from "#content";
import { notFound } from "next/navigation";
import { cache } from "react";

import { routes } from "@/lib/routing";

import type { NavItem } from "./types";

import { createNavItem, getAdjacentItems } from "./utils";

export type { Doc } from "#content";

export type DocEntry = {
  slug: string;
  title: string;
  children?: DocEntry[];
};

const SECTION_GROUPS: Record<string, string> = {
  development: "Development",
  engine: "Engine Internals",
  guides: "Guides",
  reference: "Reference",
};

export const docs: Record<string, Doc> = {};

for (const doc of veliteDocs) {
  const slug = doc.slug.replace(/^docs\//, "");
  docs[slug] = doc;
}

export const docSlugs = Object.keys(docs).sort((a, b) => {
  const depthA = a.split("/").length;
  const depthB = b.split("/").length;

  if (depthA !== depthB) {
    return depthA - depthB;
  }

  return a.localeCompare(b);
});

function buildDocsIndex(): DocEntry[] {
  const rootEntries: DocEntry[] = [];
  const groups: Record<string, DocEntry[]> = {};

  for (const slug of docSlugs) {
    const doc = docs[slug];
    const parts = slug.split("/");

    if (parts.length === 1) {
      rootEntries.push({ slug, title: doc.title });
    } else {
      const section = parts[0];
      if (!groups[section]) {
        groups[section] = [];
      }

      groups[section].push({ slug, title: doc.title });
    }
  }

  const result: DocEntry[] = [...rootEntries];

  for (const [section, children] of Object.entries(groups)) {
    const groupTitle = SECTION_GROUPS[section] ?? section;
    result.push({
      children,
      slug: section,
      title: groupTitle,
    });
  }

  return result;
}

export const docsIndex = buildDocsIndex();

export function getDoc(slug: string): Doc | undefined {
  return docs[slug];
}

export function getDocNavMeta(slug: string): NavItem {
  const doc = docs[slug];
  if (!doc) {
    return null;
  }

  return createNavItem(slug, doc.title, routes.dev.docs.index.path);
}

export function getFirstSlug(): string {
  return docSlugs[0] ?? "00-overview";
}

export const getDocPageData = cache(async (slug: string[]) => {
  const fullSlug = slug.join("/");
  const doc = getDoc(fullSlug);

  if (!doc) {
    notFound();
  }

  const { next, prev } = getAdjacentItems(docSlugs, fullSlug, getDocNavMeta);

  return {
    body: doc.body,
    description: doc.description,
    fullSlug,
    metadata: doc.metadata,
    next,
    prev,
    title: doc.title,
    toc: doc.toc,
    updatedAt: doc.updatedAt,
  };
});
