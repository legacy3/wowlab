import { createSectionOgImage, ogSize } from "@/lib/og";

export const alt = "WoW Lab Blog";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return createSectionOgImage({
    section: "Blog",
    description: "Updates, tutorials, and insights from the WoW Lab team",
  });
}
