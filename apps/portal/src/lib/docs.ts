export type DocMeta = {
  slug: string;
  title: string;
  description?: string;
};

export const docsIndex: DocMeta[] = [
  {
    slug: "00-overview",
    title: "Overview",
    description: "What WoW Lab is and how it works",
  },
  {
    slug: "01-mcp-server",
    title: "MCP Server",
    description: "Query WoW data with AI assistants",
  },
  {
    slug: "02-data-flow",
    title: "Data Flow",
    description: "How data flows through the simulation engine",
  },
];

export function getDocMeta(slug: string): DocMeta | undefined {
  return docsIndex.find((doc) => doc.slug === slug);
}

export function getAllDocSlugs(): string[] {
  return docsIndex.map((doc) => doc.slug);
}
