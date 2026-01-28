import { createSectionOgImage, ogSize } from "@/lib/og";
import { routes } from "@/lib/routing";

export const alt = "WoW Lab";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return createSectionOgImage({
    description: routes.home.description,
    section: routes.home.label,
  });
}
