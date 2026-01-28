import { createSectionOgImage, ogSize } from "@/lib/og";
import { routes } from "@/lib/routing";

export const alt = "WoW Lab Docs";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return createSectionOgImage({
    description: routes.dev.docs.index.description,
    section: routes.dev.docs.index.label,
  });
}
