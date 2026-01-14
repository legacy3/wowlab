import type { ComponentType } from "react";

export interface ContentMeta {
  title: string;
  description?: string;
}

export type TocEntry = {
  value: string;
  depth: number;
  id?: string;
  children?: TocEntry[];
};

export type ReadingTime = {
  text: string;
  minutes: number;
  time: number;
  words: number;
};

export type ContentItem<TMeta extends ContentMeta = ContentMeta> = {
  default: ComponentType;
  meta: TMeta;
  tableOfContents?: TocEntry[];
  readingTime?: ReadingTime;
};

export type NavItem = {
  slug: string;
  title: string;
  href: string;
} | null;

export type ContentEntry<TMeta extends ContentMeta = ContentMeta> = TMeta & {
  slug: string;
};
