import type {
  ContentEntry,
  ContentItem,
  ContentMeta,
  ReadingTime,
  TocEntry,
} from "@/lib/content/types";

export type BlogEntry = {
  tableOfContents?: TocEntry[];
  readingTime?: ReadingTime;
} & ContentEntry<BlogMeta>;

export interface BlogMeta extends ContentMeta {
  author: string;
  description: string;
  publishedAt: string;
  tags?: string[];
}

export type BlogPost = ContentItem<BlogMeta>;
