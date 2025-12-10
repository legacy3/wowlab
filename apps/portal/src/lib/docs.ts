export type DocMeta = {
  slug: string;
  title: string;
  description?: string;
  children?: DocMeta[];
};

export const docsIndex: DocMeta[] = [
  {
    slug: "00-overview",
    title: "Overview",
    description: "What WoWLab is and what you can do with it",
  },
  {
    slug: "01-mcp-server",
    title: "MCP Server",
    description: "Query WoW spell/item data with AI tools",
  },
  {
    slug: "02-architecture",
    title: "Architecture",
    description: "How the simulation engine works internally",
  },
  {
    slug: "03-contributing",
    title: "Contributing",
    description: "Dev setup for working on WoWLab",
  },
  {
    slug: "04-rotations",
    title: "Writing Rotations",
    description: "How to write rotation priority lists",
  },
];

function flattenDocs(docs: DocMeta[], prefix = ""): DocMeta[] {
  return docs.flatMap((doc) => {
    const fullSlug = prefix ? `${prefix}/${doc.slug}` : doc.slug;
    const flatDoc = { ...doc, slug: fullSlug };

    if (doc.children) {
      return [flatDoc, ...flattenDocs(doc.children, fullSlug)];
    }

    return [flatDoc];
  });
}

const flatDocs = flattenDocs(docsIndex);

export function getDocMeta(slug: string): DocMeta | undefined {
  return flatDocs.find((doc) => doc.slug === slug);
}

export function getAllDocSlugs(): string[] {
  return flatDocs.map((doc) => doc.slug);
}
