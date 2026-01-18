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

const stripPrefix = (s: string) => s.replace(/^docs\//, "");
const getDepth = (s: string) => s.split("/").length;
const getSection = (s: string) => s.split("/")[0];

const toTitleCase = (s: string) =>
  s
    .replace(/^\d+-/, "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export const docs = Object.fromEntries(
  veliteDocs.map((doc) => [stripPrefix(doc.slug), doc]),
) as Record<string, Doc>;

export const docSlugs = Object.keys(docs).sort((a, b) => {
  const depthDiff = getDepth(a) - getDepth(b);
  return depthDiff !== 0 ? depthDiff : a.localeCompare(b);
});

function buildDocsIndex(): DocEntry[] {
  const root: DocEntry[] = [];
  const sections = new Map<string, DocEntry[]>();

  for (const slug of docSlugs) {
    const entry = { slug, title: docs[slug].title };

    if (getDepth(slug) === 1) {
      root.push(entry);
    } else {
      const section = getSection(slug);
      if (!sections.has(section)) {
        sections.set(section, []);
      }
      sections.get(section)!.push(entry);
    }
  }

  return [
    ...root,
    ...[...sections.keys()].sort().map((section) => ({
      children: sections.get(section)!,
      slug: section,
      title: toTitleCase(section),
    })),
  ];
}

export const docsIndex = buildDocsIndex();

export const getDoc = (slug: string) => docs[slug];

export const getDocNavMeta = (slug: string): NavItem =>
  docs[slug]
    ? createNavItem(slug, docs[slug].title, routes.dev.docs.index.path)
    : null;

export const getFirstSlug = () => docSlugs[0] ?? "introduction";

export const resolveNextSteps = (slugs?: string[]): NonNullable<NavItem>[] =>
  (slugs ?? [])
    .map(getDocNavMeta)
    .filter((item): item is NonNullable<NavItem> => item !== null);

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
    nextSteps: resolveNextSteps(doc.nextSteps),
    prev,
    title: doc.title,
    toc: doc.toc,
    updatedAt: doc.updatedAt,
  };
});
