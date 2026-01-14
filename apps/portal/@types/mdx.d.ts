declare module "*.md" {
  import type { ComponentType } from "react";

  import type {
    ContentMeta,
    ReadingTime,
    TocEntry,
  } from "../src/lib/content/types";

  export const meta: ContentMeta;
  export const tableOfContents: TocEntry[] | undefined;
  export const readingTime: ReadingTime | undefined;
  const Content: ComponentType;
  export default Content;
}

declare module "*.mdx" {
  import type { ComponentType } from "react";

  import type {
    ContentMeta,
    ReadingTime,
    TocEntry,
  } from "../src/lib/content/types";

  export const meta: ContentMeta;
  export const tableOfContents: TocEntry[] | undefined;
  export const readingTime: ReadingTime | undefined;
  const Content: ComponentType;
  export default Content;
}
