import type { ComponentType } from "react";

import { MermaidRenderer } from "./mermaid";

export type CodeRenderer = ComponentType<{ code: string }>;

export const renderers: Record<string, CodeRenderer> = {
  mermaid: MermaidRenderer,
};
