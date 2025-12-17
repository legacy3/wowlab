import {
  BookOpen,
  Calculator,
  CheckSquare,
  FlaskConical,
  GitFork,
  type LucideIcon,
  PencilRuler,
  Play,
  Sparkles,
  Swords,
  Table,
  Trophy,
} from "lucide-react";

import { env } from "./env";

export type MenuItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  external?: boolean;
};

export type MenuGroup = {
  label: string;
  items: MenuItem[];
};

const item = (label: string, href: string, icon: LucideIcon): MenuItem => ({
  label,
  href,
  icon,
});

const link = (label: string, href: string, icon: LucideIcon): MenuItem => ({
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
    item("About", "/about", FlaskConical),
    item("Docs", "/docs", BookOpen),
    link("GitHub", env.GITHUB_REPO_URL, GitFork),
  ]),
];
