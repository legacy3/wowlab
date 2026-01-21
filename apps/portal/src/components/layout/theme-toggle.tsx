"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { IconButton } from "@/components/ui";

const themeIcons = {
  dark: Moon,
  light: Sun,
  system: Monitor,
} as const;

type ThemeKey = keyof typeof themeIcons;
const themeKeys: ThemeKey[] = ["light", "dark", "system"];

export function ThemeToggle() {
  const { themeToggle: content } = useIntlayer("layout");
  const { setTheme, theme = "system" } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const themeLabels: Record<ThemeKey, string> = {
    dark: content.dark,
    light: content.light,
    system: content.system,
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
      <IconButton variant="plain" size="sm" aria-label={content.toggleTheme}>
        <Monitor size={18} />
      </IconButton>
    );
  }

  return (
    <IconButton
      variant="plain"
      size="sm"
      aria-label={content.toggleTheme}
      title={`${content.themeLabel} ${themeLabels[currentKey]}`}
      onClick={cycle}
    >
      <Icon size={18} />
    </IconButton>
  );
}
