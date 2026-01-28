import { type Doc, docs as veliteDocs } from "#content";
import { capitalCase } from "change-case";
import { notFound } from "next/navigation";
import { cache } from "react";

import { routes } from "@/lib/routing";

import type { NavItem } from "./types";

import { createNavItem, getAdjacentItems } from "./utils";

export type { Doc } from "#content";

export type DocEntry = {
  slug: string;
  title: string;
  order: number;
  children?: DocEntry[];
};

const toTitle = (s: string) => capitalCase(s.replace(/^\d+-/, ""));

const stripNumbers = (path: string) =>
  path
    .split("/")
    .map((s) => s.replace(/^\d+-/, ""))
    .join("/");

const extractOrder = (segment: string): number => {
  const match = segment.match(/^(\d+)-/);
  if (!match) {
    throw new Error(`Doc path segment missing number prefix: ${segment}`);
  }

  return parseInt(match[1], 10);
};

const { docs, sortKeyToSlug } = (() => {
  const docsMap: Record<string, Doc> = {};
  const sortKeyMap: Record<string, string> = {};

  for (const doc of veliteDocs) {
    const sortKey = doc.sortKey.replace(/^docs\//, "");
    const cleanSlug = stripNumbers(sortKey);

    docsMap[cleanSlug] = doc;
    sortKeyMap[sortKey] = cleanSlug;
  }

  return { docs: docsMap, sortKeyToSlug: sortKeyMap };
})();

export { docs };

export const getDoc = (slug: string) => docs[slug];

export const resolveNumberedPath = (numberedPath: string): string | undefined =>
  sortKeyToSlug[numberedPath];

export const docSlugs = Object.entries(sortKeyToSlug)
  .sort(([a], [b]) => {
    const diff = a.split("/").length - b.split("/").length;
    return diff !== 0 ? diff : a.localeCompare(b);
  })
  .map(([, cleanSlug]) => cleanSlug);

const slugToSortKey = Object.fromEntries(
  Object.entries(sortKeyToSlug).map(([sortKey, slug]) => [slug, sortKey]),
);

function buildDocsIndex(): DocEntry[] {
  const entries = new Map<string, DocEntry>();
  const sectionOrder: string[] = []; // Track insertion order (already sorted)

  for (const slug of docSlugs) {
    const sortKey = slugToSortKey[slug]!;
    const [key, ...rest] = slug.split("/");
    const sortKeySegments = sortKey.split("/");
    const isRoot = rest.length === 0;

    if (isRoot) {
      const order = extractOrder(sortKeySegments[0]!);
      entries.set(key, { order, slug, title: getDoc(slug).title });

      if (!sectionOrder.includes(key)) {
        sectionOrder.push(key);
      }

      continue;
    }

    if (!entries.has(key)) {
      const order = extractOrder(sortKeySegments[0]!);

      entries.set(key, {
        children: [],
        order,
        slug: key,
        title: toTitle(sortKeySegments[0]!),
      });
      sectionOrder.push(key);
    }

    const section = entries.get(key)!;
    const childOrder = extractOrder(sortKeySegments[1]!);

    section.children!.push({
      order: childOrder,
      slug,
      title: getDoc(slug).title,
    });
  }

  return sectionOrder.map((k) => entries.get(k)!);
}

export const docsIndex = buildDocsIndex();

export const getDocNavMeta = (slug: string): NavItem => {
  const doc = getDoc(slug);

  return doc
    ? createNavItem(slug, doc.title, routes.dev.docs.index.path)
    : null;
};

export const getFirstSlug = () => docSlugs[0]!;

export const resolveNextSteps = (
  numberedPaths?: string[],
): NonNullable<NavItem>[] =>
  (numberedPaths ?? [])
    .map((numberedPath) => {
      const cleanSlug = resolveNumberedPath(numberedPath);
      return cleanSlug ? getDocNavMeta(cleanSlug) : null;
    })
    .filter((item): item is NonNullable<NavItem> => item !== null);

export const getDocPageData = cache(async (slug: string[]) => {
  const fullSlug = slug.join("/");
  const doc = getDoc(fullSlug);

  if (!doc) {
    notFound();
  }

  const { next, prev } = getAdjacentItems(docSlugs, fullSlug, getDocNavMeta);

  // sortKey has the original numbered path for file references
  const sortKey = doc.sortKey.replace(/^docs\//, "");

  return {
    body: doc.body,
    description: doc.description,
    fullSlug,
    metadata: doc.metadata,
    next,
    nextSteps: resolveNextSteps(doc.nextSteps),
    prev,
    sortKey,
    title: doc.title,
    toc: doc.toc,
    updatedAt: doc.updatedAt,
  };
});
