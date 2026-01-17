"use client";

import { AppleIcon, LinuxIcon, WindowsIcon } from "@/lib/icons";

import type { NodePlatform } from "./types";

interface PlatformIconProps {
  platform: NodePlatform;
  size?: number;
}

export function PlatformIcon({ platform, size = 16 }: PlatformIconProps) {
  const props = { height: size, width: size };

  switch (platform) {
    case "linux":
    case "linux-arm":
      return <LinuxIcon {...props} />;
    case "macos":
      return <AppleIcon {...props} />;
    case "windows":
      return <WindowsIcon {...props} />;
  }
}
