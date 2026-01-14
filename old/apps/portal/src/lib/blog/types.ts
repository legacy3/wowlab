import type {
  ContentItem,
  ContentEntry,
  ContentMeta,
  TocEntry,
  ReadingTime,
} from "@/lib/content/types";

export interface BlogMeta extends ContentMeta {
  description: string;
  publishedAt: string;
  author: string;
  tags?: string[];
}

export type BlogPost = ContentItem<BlogMeta>;

export type BlogEntry = ContentEntry<BlogMeta> & {
  tableOfContents?: TocEntry[];
  readingTime?: ReadingTime;
};
