export type DocMeta = {
  slug: string;
  title: string;
  description?: string;
  children?: DocMeta[];
};

function page(slug: string, title: string, description?: string): DocMeta {
  return { slug, title, description };
}

function group(slug: string, title: string, children: DocMeta[]): DocMeta {
  return { slug, title, children };
}

// prettier-ignore
export const docsIndex: DocMeta[] = [
  page("00-overview", "Overview", "What WoWLab is and what you can do with it"),
  group("guides", "Guides", [
    page("00-rotations", "Writing Rotations", "How to write rotation priority lists"),
    page("01-spec-coverage", "Spec Coverage", "Check which spells are supported for each spec"),
  ]),
  group("reference", "Reference", [
    page("00-architecture", "Architecture", "How the simulation engine works internally"),
    page("01-data-model", "Data Model", "How spell data is assembled at runtime"),
    page("02-mcp-server", "MCP Server", "Query WoW spell/item data with AI tools"),
  ]),
  group("development", "Development", [
    page("00-contributing", "Contributing", "Dev setup for working on WoWLab"),
  ]),
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
const pageDocs = flatDocs.filter((doc) => !doc.children);

export function getDocMeta(slug: string): DocMeta | undefined {
  return flatDocs.find((doc) => doc.slug === slug);
}

export function getAllDocSlugs(): string[] {
  return pageDocs.map((doc) => doc.slug);
}
