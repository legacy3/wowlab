"use client";

import { useState, useEffect, useCallback } from "react";

interface UseZenModeOptions {
  onExit?: () => void;
}

export function useZenMode(options: UseZenModeOptions = {}) {
  const [isZen, setIsZen] = useState(false);

  const enterZen = useCallback(() => setIsZen(true), []);
  const exitZen = useCallback(() => {
    setIsZen(false);
    options.onExit?.();
  }, [options]);
  const toggleZen = useCallback(() => setIsZen((z) => !z), []);

  useEffect(() => {
    if (!isZen) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        exitZen();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isZen, exitZen]);

  return {
    isZen,
    enterZen,
    exitZen,
    toggleZen,
  };
}
