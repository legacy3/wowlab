import type { NodePlatform } from "@/components/nodes/types";

export const GITHUB_REPO = "legacy3/wowlab";

export const NODE_VARIANTS = ["gui", "headless"] as const;
export type NodeVariant = (typeof NODE_VARIANTS)[number];

export const NODE_PLATFORMS: readonly NodePlatform[] = [
  "linux",
  "linux-arm",
  "macos",
  "windows",
];

const PLATFORM_TARGETS: Record<NodePlatform, string> = {
  linux: "x86_64-unknown-linux-gnu",
  "linux-arm": "aarch64-unknown-linux-gnu",
  macos: "aarch64-apple-darwin",
  windows: "x86_64-pc-windows-msvc",
};

export interface PlatformInfo {
  arch: string;
  id: NodePlatform;
  name: string;
}

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

export const PLATFORM_INFO: PlatformInfo[] = [
  { arch: "Apple Silicon", id: "macos", name: "macOS" },
  { arch: "x64", id: "windows", name: "Windows" },
  { arch: "x64", id: "linux", name: "Linux" },
  { arch: "ARM64", id: "linux-arm", name: "Linux" },
];

export function getNodeDownloadUrl(
  platform: NodePlatform,
  variant: NodeVariant = "gui",
): string {
  return variant === "gui"
    ? `/go/node-${platform}`
    : `/go/node-headless-${platform}`;
}

export const DOCKER_URL = "/go/github/pkgs/container/wowlab-node";
