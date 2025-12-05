import {
  BarChart2,
  BarChart3,
  Bug,
  Cpu,
  Crown,
  FileCode,
  GitBranch,
  History,
  Layers,
  LucideIcon,
  Medal,
  Plug,
  RotateCcw,
  ScrollText,
  Search,
  Target,
  Upload,
  Wrench,
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
    item("Simulate", "/sim", Zap),
    item("Results", "/sim/results", BarChart2),
    item("Import", "/sim/import", Upload),
  ]),
  group("Optimize", [
    item("Top Gear", "/top-gear", Crown),
    item("Drop Optimizer", "/drop-optimizer", Target),
  ]),
  group("Discover", [
    item("DPS Rankings", "/dps-rankings", Medal),
    item("Rotations", "/rotations", RotateCcw),
    item("Charts", "/charts", BarChart3),
  ]),
  group("Advanced", [
    item("Editor", "/editor", FileCode),
    item("Timeline", "/timeline", History),
    item("Timeline Konva", "/timeline-konva", Layers),
    item("Workbench", "/workbench", Wrench),
    item("Computing", "/computing", Cpu),
    item("Data Inspector", "/data-inspector", Search),
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
