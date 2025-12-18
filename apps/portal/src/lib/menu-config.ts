import type { ComponentType, SVGProps } from "react";
import {
  BookOpen,
  Calculator,
  FlaskConical,
  Newspaper,
  Play,
  Swords,
} from "lucide-react";

import { env } from "./env";
import { DiscordIcon, GitHubIcon, LogoIcon } from "./icons";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

// Flat menu item (no subitems)
export type MenuItem = {
  label: string;
  href: string;
  icon: Icon;
  external?: boolean;
};

// Collapsible nav item with subitems
export type NavItem = {
  label: string;
  href: string;
  icon: Icon;
  isActive?: boolean;
  items: SubItem[];
};

type SubItem = {
  label: string;
  href: string;
};

// Factory functions
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

const sub = (label: string, href: string): SubItem => ({
  label,
  href,
});

const nav = (
  label: string,
  href: string,
  icon: Icon,
  items: SubItem[],
): NavItem => ({
  label,
  href,
  icon,
  items,
});

// Main collapsible navigation items
// prettier-ignore
export const navMain: NavItem[] = [
  nav("Simulate", "/simulate", Play, [
    sub("Quick Sim", "/simulate"),
    sub("Optimize", "/optimize"),
    sub("Rankings", "/rankings"),
  ]),
  nav("Plan", "/talents", Calculator, [
    sub("Talents", "/talents"),
  ]),
  nav("Rotations", "/rotations", Swords, [
    sub("Browse", "/rotations"),
    sub("Create", "/rotations/editor"),
  ]),
  nav("Lab", "/lab", FlaskConical, [
    sub("Overview", "/lab"),
    sub("Data Inspector", "/lab/inspector/search"),
    sub("Spec Coverage", "/lab/spec-coverage"),
  ]),
];

// Secondary flat navigation (docs, resources, etc.)
// prettier-ignore
export const navSecondary: MenuItem[] = [
  item("About", "/about", LogoIcon),
  item("Blog", "/blog", Newspaper),
  item("Docs", "/docs", BookOpen),
];

// Social links (icons only in footer)
// prettier-ignore
export const navSocial: MenuItem[] = [
  link("Discord", "/discord", DiscordIcon),
  link("GitHub", env.GITHUB_REPO_URL, GitHubIcon),
];
