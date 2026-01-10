import type { NavItem } from "./types";

export function createNavItem(
  slug: string,
  title: string,
  basePath: string,
): NonNullable<NavItem> {
  return {
    href: `${basePath}/${slug}`,
    slug,
    title,
  };
}

export function getAdjacentItems(
  slugs: string[],
  currentSlug: string,
  getNavMeta: (slug: string) => NavItem,
): { prev: NavItem; next: NavItem } {
  const currentIndex = slugs.indexOf(currentSlug);
  const prev = currentIndex > 0 ? getNavMeta(slugs[currentIndex - 1]) : null;
  const next =
    currentIndex < slugs.length - 1
      ? getNavMeta(slugs[currentIndex + 1])
      : null;

  return { next, prev };
}
