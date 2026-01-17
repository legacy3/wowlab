"use client";

import { useMemo } from "react";

import type { NodePlatform } from "@/components/nodes/types";

declare global {
  interface Navigator {
    userAgentData?: {
      platform: string;
    };
  }
}

export function useDetectedPlatform(): NodePlatform | null {
  return useMemo(() => detectPlatform(), []);
}

function detectPlatform(): NodePlatform | null {
  if (typeof navigator === "undefined") {
    return null;
  }

  // Modern API (Chromium only)
  const platform = (
    navigator.userAgentData?.platform ?? navigator.userAgent
  ).toLowerCase();

  if (platform.includes("win")) {
    return "windows";
  }

  if (platform.includes("mac")) {
    return "macos";
  }

  if (platform.includes("linux")) {
    return "linux";
  }

  return null;
}
