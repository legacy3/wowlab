import { createSectionOgImage, ogSize } from "@/lib/og";

export const alt = "WoW Lab Docs";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return createSectionOgImage({
    section: "Docs",
    description: "Technical documentation for WoW Lab",
  });
}
