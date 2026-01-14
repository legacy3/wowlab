import type { NavItem } from "./types";

export function createNavItem(
  slug: string,
  title: string,
  basePath: string,
): NonNullable<NavItem> {
  return {
    slug,
    title,
    href: `${basePath}/${slug}`,
  };
}

export function getAdjacentItems<T extends { slug: string; title?: string }>(
  items: T[],
  currentSlug: string,
  basePath: string,
  getTitle: (item: T) => string,
): { prev: NavItem; next: NavItem } {
  const currentIndex = items.findIndex((item) => item.slug === currentSlug);

  const prev =
    currentIndex > 0
      ? createNavItem(
          items[currentIndex - 1].slug,
          getTitle(items[currentIndex - 1]),
          basePath,
        )
      : null;

  const next =
    currentIndex < items.length - 1
      ? createNavItem(
          items[currentIndex + 1].slug,
          getTitle(items[currentIndex + 1]),
          basePath,
        )
      : null;

  return { prev, next };
}
