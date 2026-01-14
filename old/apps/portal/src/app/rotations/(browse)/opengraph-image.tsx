import { createSectionOgImage, ogSize } from "@/lib/og";

export const alt = "WoW Lab Rotations";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return createSectionOgImage({
    section: "Rotations",
    description: "Browse and share rotation scripts",
  });
}
