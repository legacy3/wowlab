"use client";

import { Charset, Document } from "flexsearch";

import { docs } from "./content/docs";

export type SearchResult = {
  slug: string;
  title: string;
  description?: string;
};

type DocData = {
  id: string;
  title: string;
  description: string;
};

let index: Document<DocData> | null = null;

export function searchDocs(query: string, limit = 10): SearchResult[] {
  if (!query.trim()) {
    return [];
  }

  const idx = getIndex();
  const results = idx.search(query, {
    enrich: true,
    limit,
    merge: true,
  });

  return results.map((result) => ({
    description: result.doc?.description || undefined,
    slug: result.id as string,
    title: result.doc?.title ?? (result.id as string),
  }));
}

function getIndex() {
  if (index) {
    return index;
  }

  index = new Document<DocData>({
    cache: 100,
    document: {
      id: "id",
      index: [
        {
          encoder: Charset.LatinBalance,
          field: "title",
          resolution: 9,
          tokenize: "forward",
        },
        {
          encoder: Charset.LatinBalance,
          field: "description",
          resolution: 6,
          tokenize: "forward",
        },
      ],
      store: ["title", "description"],
    },
  });

  for (const [slug, doc] of Object.entries(docs)) {
    index.add({
      description: doc.description ?? "",
      id: slug,
      title: doc.title,
    });
  }

  return index;
}
