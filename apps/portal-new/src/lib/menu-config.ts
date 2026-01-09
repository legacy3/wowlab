import type { LucideIcon } from "lucide-react";

import { BookOpen, Calculator, FlaskConical, Play, Swords } from "lucide-react";

import { routes } from "./routes";

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

type Icon = LucideIcon;

type SubItem = {
  label: string;
  href: string;
};

export const navMain: NavItem[] = [
  {
    href: routes.simulate.index,
    icon: Play,
    items: [
      { href: routes.simulate.index, label: "Quick Sim" },
      { href: routes.optimize, label: "Optimize" },
      { href: routes.rankings, label: "Rankings" },
    ],
    label: "Simulate",
  },
  {
    href: routes.talents,
    icon: Calculator,
    items: [{ href: routes.talents, label: "Talents" }],
    label: "Plan",
  },
  {
    href: routes.rotations.index,
    icon: Swords,
    items: [
      { href: routes.rotations.index, label: "Browse" },
      { href: routes.rotations.editor, label: "Create" },
    ],
    label: "Rotations",
  },
  {
    href: routes.lab.index,
    icon: FlaskConical,
    items: [
      { href: routes.lab.index, label: "Overview" },
      { href: routes.lab.inspector, label: "Data Inspector" },
    ],
    label: "Lab",
  },
];

export const navSecondary: MenuItem[] = [
  { href: routes.docs, icon: BookOpen, label: "Docs" },
];
