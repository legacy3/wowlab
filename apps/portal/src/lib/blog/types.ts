import type {
  ContentItem,
  ContentEntry,
  ContentMeta,
  TocEntry,
  ReadingTime,
} from "@/lib/content/types";

export interface BlogMeta extends ContentMeta {
  title: string;
  description: string;
  publishedAt: string;
  author: string;
  tags?: string[];
}

export type BlogPost = ContentItem<BlogMeta>;

export type BlogEntry = ContentEntry<BlogMeta> & {
  publishedAt: string;
  author: string;
  tags?: string[];
  tableOfContents?: TocEntry[];
  readingTime?: ReadingTime;
};
