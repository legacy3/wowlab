import { type AboutPage, about as veliteAbout } from "#content";

export type { AboutPage } from "#content";

export const aboutPages: AboutPage[] = veliteAbout.sort(
  (a, b) => (a.order ?? 0) - (b.order ?? 0),
);

export function getAboutPage(slug: string): AboutPage | undefined {
  return aboutPages.find(
    (page) => page.slug === slug || page.slug === `about/${slug}`,
  );
}
