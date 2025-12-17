declare module "*.md" {
  import type { ComponentType } from "react";
  import type { DocMeta } from "../src/lib/docs/types";

  export const meta: DocMeta;
  const Content: ComponentType;
  export default Content;
}

declare module "*.mdx" {
  import type { ComponentType } from "react";
  import type { DocMeta } from "../src/lib/docs/types";

  export const meta: DocMeta;
  const Content: ComponentType;
  export default Content;
}
