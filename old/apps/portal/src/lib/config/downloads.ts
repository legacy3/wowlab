export const GITHUB_REPO = "legacy3/wowlab";

export const NODE_VARIANTS = ["gui", "headless"] as const;
export type NodeVariant = (typeof NODE_VARIANTS)[number];

export const NODE_PLATFORMS = [
  "linux",
  "linux-arm",
  "macos",
  "windows",
] as const;
export type NodePlatform = (typeof NODE_PLATFORMS)[number];

const PLATFORM_TARGETS: Record<NodePlatform, string> = {
  linux: "x86_64-unknown-linux-gnu",
  "linux-arm": "aarch64-unknown-linux-gnu",
  macos: "aarch64-apple-darwin",
  windows: "x86_64-pc-windows-msvc",
};

export function getAssetPattern(
  variant: NodeVariant,
  platform: NodePlatform,
): RegExp {
  const binary = variant === "gui" ? "node-gui" : "node-headless";
  const target = PLATFORM_TARGETS[platform];
  const ext = platform === "windows" ? "\\.zip$" : "\\.tar\\.gz$";

  return new RegExp(`${binary}-v[\\d.]+-${target}${ext}`);
}

export function isValidPlatform(value: string): value is NodePlatform {
  return NODE_PLATFORMS.includes(value as NodePlatform);
}

export function isValidVariant(value: string): value is NodeVariant {
  return NODE_VARIANTS.includes(value as NodeVariant);
}

export interface PlatformInfo {
  id: NodePlatform;
  name: string;
  arch: string;
}

export const PLATFORM_INFO: PlatformInfo[] = [
  { id: "windows", name: "Windows", arch: "x64" },
  { id: "macos", name: "macOS", arch: "Apple Silicon" },
  { id: "linux", name: "Linux", arch: "x64" },
  { id: "linux-arm", name: "Linux", arch: "ARM64" },
];

export function getNodeDownloadUrl(
  platform: NodePlatform,
  variant: NodeVariant = "gui",
): string {
  return variant === "gui"
    ? `/go/node-${platform}`
    : `/go/node-headless-${platform}`;
}
