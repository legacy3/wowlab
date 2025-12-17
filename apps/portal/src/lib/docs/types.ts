import type { ComponentType } from "react";

export interface DocMeta {
  title: string;
  description?: string;
  updatedAt?: string;
}

export type Doc = {
  default: ComponentType;
  meta: DocMeta;
};

export type DocEntry = DocMeta & {
  slug: string;
  children?: DocEntry[];
};
