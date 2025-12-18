import type { ComponentType, SVGProps } from "react";
import {
  BookOpen,
  Calculator,
  CheckSquare,
  FlaskConical,
  Newspaper,
  PencilRuler,
  Play,
  Sparkles,
  Swords,
  Table,
  Trophy,
} from "lucide-react";

import { env } from "./env";
import { DiscordIcon, GitHubIcon, LogoIcon } from "./icons";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

export type MenuItem = {
  label: string;
  href: string;
  icon: Icon;
  external?: boolean;
};

export type MenuGroup = {
  label: string;
  items: MenuItem[];
};

const item = (label: string, href: string, icon: Icon): MenuItem => ({
  label,
  href,
  icon,
});

const link = (label: string, href: string, icon: Icon): MenuItem => ({
  label,
  href,
  icon,
  external: true,
});

const group = (label: string, items: MenuItem[]): MenuGroup => ({
  label,
  items,
});

// prettier-ignore
export const menuConfig: MenuGroup[] = [
  group("Simulate", [
    item("Simulate", "/simulate", Play),
  ]),
  group("Plan", [
    item("Talents", "/talents", Calculator),
  ]),
  group("Optimize", [
    item("Optimize", "/optimize", Sparkles),
  ]),
  group("Discover", [
    item("Rankings", "/rankings", Trophy),
  ]),
  group("Rotations", [
    item("Browse", "/rotations", Swords),
    item("Create", "/rotations/editor", PencilRuler),
  ]),
  group("Lab", [
    item("Overview", "/lab", FlaskConical),
    item("Data Inspector", "/lab/inspector/search", Table),
    item("Spec Coverage", "/lab/spec-coverage", CheckSquare),
  ]),
  group("About", [
    item("About", "/about", LogoIcon),
    item("Blog", "/blog", Newspaper),
    item("Docs", "/docs", BookOpen),
    link("Discord", "/discord", DiscordIcon),
    link("GitHub", env.GITHUB_REPO_URL, GitHubIcon),
  ]),
];
