import {
  Activity,
  BarChart3,
  Bug,
  Clock,
  Database,
  FileCode,
  FileText,
  Library,
  Loader2,
  LucideIcon,
  Medal,
  Target,
  TrendingUp,
  Upload,
  Zap,
} from "lucide-react";

export type MenuItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type MenuGroup = {
  label: string;
  items: MenuItem[];
};

export const menuConfig: MenuGroup[] = [
  {
    label: "Simulate",
    items: [
      { label: "Simulate", href: "/sim", icon: Zap },
      { label: "Results", href: "/sim/results", icon: Activity },
      { label: "Import", href: "/sim/import", icon: Upload },
    ],
  },
  {
    label: "Optimize",
    items: [
      { label: "Top Gear", href: "/top-gear", icon: TrendingUp },
      { label: "Drop Optimizer", href: "/drop-optimizer", icon: Target },
    ],
  },
  {
    label: "Discover",
    items: [
      { label: "DPS Rankings", href: "/dps-rankings", icon: Medal },
      { label: "Rotations", href: "/rotations", icon: Library },
      { label: "Charts", href: "/charts", icon: BarChart3 },
    ],
  },
  {
    label: "Advanced",
    items: [
      { label: "Editor", href: "/editor", icon: FileCode },
      { label: "Timeline", href: "/timeline", icon: Clock },
      { label: "Workbench", href: "/workbench", icon: Activity },
      { label: "Computing", href: "/computing", icon: Loader2 },
      { label: "Data Inspector", href: "/data-inspector", icon: Database },
    ],
  },
  {
    label: "About",
    items: [{ label: "Changelog", href: "/changelog", icon: FileText }],
  },
  {
    label: "Debug",
    items: [{ label: "Simulation", href: "/debug/simulation", icon: Bug }],
  },
];
