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
  children?: DocEntry[];
};

const toTitle = (s: string) => capitalCase(s.replace(/^\d+-/, ""));

export const docs = Object.fromEntries(
  veliteDocs.map((doc) => [doc.slug.replace(/^docs\//, ""), doc]),
) as Record<string, Doc>;

export const getDoc = (slug: string) => docs[slug];

export const docSlugs = Object.keys(docs).sort((a, b) => {
  const diff = a.split("/").length - b.split("/").length;

  return diff !== 0 ? diff : a.localeCompare(b);
});

function buildDocsIndex(): DocEntry[] {
  const entries = new Map<string, DocEntry>();

  for (const slug of docSlugs) {
    const [key, ...rest] = slug.split("/");
    const isRoot = rest.length === 0;

    if (isRoot) {
      entries.set(key, { slug, title: getDoc(slug).title });
      continue;
    }

    const section = entries.get(key) ?? {
      children: [],
      slug: key,
      title: toTitle(key),
    };

    entries.set(key, section);
    section.children!.push({ slug, title: getDoc(slug).title });
  }

  return [...entries.keys()].sort().map((k) => entries.get(k)!);
}

export const docsIndex = buildDocsIndex();

export const getDocNavMeta = (slug: string): NavItem => {
  const doc = getDoc(slug);

  return doc
    ? createNavItem(slug, doc.title, routes.dev.docs.index.path)
    : null;
};

export const getFirstSlug = () => docSlugs[0]!;

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
