import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Calculator,
  FlaskConical,
  Play,
  Swords,
} from "lucide-react";

type Icon = LucideIcon;

export type MenuItem = {
  label: string;
  href: string;
  icon: Icon;
  external?: boolean;
};

export type NavItem = {
  label: string;
  href: string;
  icon: Icon;
  items: SubItem[];
};

type SubItem = {
  label: string;
  href: string;
};

export const navMain: NavItem[] = [
  {
    label: "Simulate",
    href: "/simulate",
    icon: Play,
    items: [
      { label: "Quick Sim", href: "/simulate" },
      { label: "Optimize", href: "/optimize" },
      { label: "Rankings", href: "/rankings" },
    ],
  },
  {
    label: "Plan",
    href: "/talents",
    icon: Calculator,
    items: [{ label: "Talents", href: "/talents" }],
  },
  {
    label: "Rotations",
    href: "/rotations",
    icon: Swords,
    items: [
      { label: "Browse", href: "/rotations" },
      { label: "Create", href: "/rotations/editor" },
    ],
  },
  {
    label: "Lab",
    href: "/lab",
    icon: FlaskConical,
    items: [
      { label: "Overview", href: "/lab" },
      { label: "Data Inspector", href: "/lab/inspector/search" },
    ],
  },
];

export const navSecondary: MenuItem[] = [
  { label: "Docs", href: "/docs", icon: BookOpen },
];
