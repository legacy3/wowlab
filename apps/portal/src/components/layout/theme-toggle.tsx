"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useExtracted } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { IconButton } from "@/components/ui";

// TODO Refactor this file to single source of truth
const themeIcons = {
  dark: Moon,
  light: Sun,
  system: Monitor,
} as const;

type ThemeKey = keyof typeof themeIcons;
const themeKeys: ThemeKey[] = ["light", "dark", "system"];

export function ThemeToggle() {
  const t = useExtracted();
  const { setTheme, theme = "system" } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const themeLabels: Record<ThemeKey, string> = {
    dark: t("Dark"),
    light: t("Light"),
    system: t("System"),
  };

  const currentKey =
    (theme as ThemeKey) in themeIcons ? (theme as ThemeKey) : "system";
  const Icon = themeIcons[currentKey];

  const cycle = () => {
    const idx = themeKeys.indexOf(currentKey);
    const next = themeKeys[(idx + 1) % themeKeys.length];

    setTheme(next);
  };

  if (!mounted) {
    return (
      <IconButton variant="plain" size="sm" aria-label={t("Toggle theme")}>
        <Monitor size={18} />
      </IconButton>
    );
  }

  return (
    <IconButton
      variant="plain"
      size="sm"
      aria-label={t("Toggle theme")}
      title={t("Theme: {theme}", { theme: themeLabels[currentKey] })}
      onClick={cycle}
    >
      <Icon size={18} />
    </IconButton>
  );
}
