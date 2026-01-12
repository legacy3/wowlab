"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { IconButton } from "@/components/ui";

const themes = [
  { icon: Sun, key: "light", label: "Light" },
  { icon: Moon, key: "dark", label: "Dark" },
  { icon: Monitor, key: "system", label: "System" },
] as const;

type ThemeKey = (typeof themes)[number]["key"];

const themeMap = Object.fromEntries(themes.map((t) => [t.key, t])) as Record<
  ThemeKey,
  (typeof themes)[number]
>;

export function ThemeToggle() {
  const { setTheme, theme = "system" } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const current = themeMap[theme as ThemeKey] ?? themeMap.system;
  const Icon = current.icon;

  const cycle = () => {
    const idx = themes.findIndex((t) => t.key === theme);
    const next = themes[(idx + 1) % themes.length];

    setTheme(next.key);
  };

  if (!mounted) {
    return (
      <IconButton variant="plain" size="sm" aria-label="Toggle theme">
        <Monitor size={18} />
      </IconButton>
    );
  }

  return (
    <IconButton
      variant="plain"
      size="sm"
      aria-label="Toggle theme"
      title={`Theme: ${current.label}`}
      onClick={cycle}
    >
      <Icon size={18} />
    </IconButton>
  );
}
