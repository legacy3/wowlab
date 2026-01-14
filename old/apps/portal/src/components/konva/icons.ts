import { env } from "@/lib/env";

export function getIconUrl(
  iconName: string,
  size: "small" | "medium" | "large" = "medium",
): string {
  return `${env.SUPABASE_URL}/functions/v1/icons/${size}/${iconName}.jpg`;
}

export function preloadIcons(
  iconNames: string[],
  size: "small" | "medium" | "large" = "medium",
): void {
  for (const iconName of iconNames) {
    const img = new Image();
    img.src = getIconUrl(iconName, size);
  }
}
