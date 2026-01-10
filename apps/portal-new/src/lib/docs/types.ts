import type {
  ContentEntry,
  ContentItem,
  ContentMeta,
} from "@/lib/content/types";

export type Doc = ContentItem<DocMeta>;

export type DocEntry = {
  children?: DocEntry[];
} & ContentEntry<DocMeta>;

export interface DocMeta extends ContentMeta {
  updatedAt?: string;
}
