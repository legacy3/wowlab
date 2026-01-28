"use client";

import { HelpCircleIcon } from "lucide-react";

import { AppleIcon, LinuxIcon, WindowsIcon } from "@/lib/icons";

interface PlatformIconProps {
  platform: string;
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
    default:
      return <HelpCircleIcon size={size} />;
  }
}
