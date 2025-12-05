import {
  Bug,
  Crown,
  FileCode,
  GitBranch,
  LucideIcon,
  Medal,
  Plug,
  RotateCcw,
  ScrollText,
  Search,
  Zap,
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
    item("Simulate", "/simulate", Zap),
  ]),
  group("Optimize", [
    item("Optimize", "/optimize", Crown),
  ]),
  group("Discover", [
    item("Rankings", "/rankings", Medal),
    item("Rotations", "/rotations", RotateCcw),
  ]),
  group("Create", [
    item("Editor", "/rotations/editor", FileCode),
  ]),
  group("Lab", [
    item("Data Inspector", "/lab/data-inspector", Search),
  ]),
  group("About", [
    item("Changelog", "/changelog", ScrollText),
    link("GitHub", env.GITHUB_REPO_URL, GitBranch),
    link("MCP Server", `${env.GITHUB_REPO_URL}/tree/main/apps/mcp-server`, Plug),
  ]),
  group("Debug", [
    item("Simulation", "/debug/simulation", Bug),
  ]),
];
