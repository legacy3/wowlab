import {
  BookOpen,
  Calculator,
  CheckSquare,
  FlaskConical,
  GitFork,
  History,
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
  group("Optimize", [
    item("Optimize", "/optimize", Sparkles),
  ]),
  group("Discover", [
    item("Rankings", "/rankings", Trophy),
    item("Rotations", "/rotations", Swords),
  ]),
  group("Create", [
    item("Editor", "/rotations/editor", PencilRuler),
  ]),
  group("Lab", [
    item("Data Inspector", "/lab/data-inspector", Table),
    item("Spec Coverage", "/lab/spec-coverage", CheckSquare),
    item("Talent Calculator", "/lab/talent-calculator", Calculator),
  ]),
  group("About", [
    item("About", "/about", FlaskConical),
    item("Changelog", "/changelog", History),
    item("Docs", "/docs", BookOpen),
    link("GitHub", env.GITHUB_REPO_URL, GitFork),
  ]),
];
