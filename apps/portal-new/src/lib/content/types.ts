import type { ComponentType } from "react";

export type ContentEntry<TMeta extends ContentMeta = ContentMeta> = {
  slug: string;
} & TMeta;

export type ContentItem<TMeta extends ContentMeta = ContentMeta> = {
  default: ComponentType;
  meta: TMeta;
  tableOfContents?: TocEntry[];
  readingTime?: ReadingTime;
};

export interface ContentMeta {
  description?: string;
  title: string;
}

export type NavItem = {
  slug: string;
  title: string;
  href: string;
} | null;

export type ReadingTime = {
  text: string;
  minutes: number;
  time: number;
  words: number;
};

export type TocEntry = {
  value: string;
  depth: number;
  id?: string;
  children?: TocEntry[];
};
