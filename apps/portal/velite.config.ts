import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import { createCssVariablesTheme } from "shiki";
import { defineCollection, defineConfig, s } from "velite";

const codeTheme = createCssVariablesTheme({
  name: "css-variables",
  variablePrefix: "--shiki-",
});

const baseSchema = {
  body: s.mdx(),
  description: s.string().optional(),
  metadata: s.metadata(),
  slug: s.path(),
  title: s.string(),
  toc: s.toc(),
  updatedAt: s.isodate().optional(),
};

const about = defineCollection({
  name: "AboutPage",
  pattern: "about/*.mdx",
  schema: s.object({
    ...baseSchema,
    order: s.number().optional(),
  }),
});

const blog = defineCollection({
  name: "BlogPost",
  pattern: "blog/**/*.mdx",
  schema: s.object({
    ...baseSchema,
    author: s.string().optional(),
    publishedAt: s.isodate(),
    tags: s.array(s.string()).optional(),
  }),
});

const docs = defineCollection({
  name: "Doc",
  pattern: "docs/**/*.mdx",
  schema: s.object(baseSchema),
});

export default defineConfig({
  collections: { about, blog, docs },
  mdx: {
    rehypePlugins: [rehypeSlug, [rehypePrettyCode, { theme: codeTheme }]],
  },
  output: {
    assets: "public/static",
    base: "/static/",
    clean: true,
    data: ".velite",
    name: "[name]-[hash:6].[ext]",
  },
  root: "src/content",
});
