// TODO Get these types from the lib
export type NavItem = {
  slug: string;
  title: string;
  href: string;
} | null;

export type TocEntry = {
  title: string;
  url: string;
  items: TocEntry[];
};
