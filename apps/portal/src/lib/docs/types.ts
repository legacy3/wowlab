import type {
  ContentItem,
  ContentEntry,
  ContentMeta,
} from "@/lib/content/types";

export interface DocMeta extends ContentMeta {
  title: string;
  description?: string;
  updatedAt?: string;
}

export type Doc = ContentItem<DocMeta>;

export type DocEntry = ContentEntry<DocMeta> & {
  children?: DocEntry[];
};
