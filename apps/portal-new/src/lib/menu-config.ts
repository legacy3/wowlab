import type { LucideIcon } from "lucide-react";
import { BookOpen, Calculator, FlaskConical, Play, Swords } from "lucide-react";
import { routes } from "./routes";

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
    href: routes.simulate.index,
    icon: Play,
    items: [
      { label: "Quick Sim", href: routes.simulate.index },
      { label: "Optimize", href: routes.optimize },
      { label: "Rankings", href: routes.rankings },
    ],
  },
  {
    label: "Plan",
    href: routes.talents,
    icon: Calculator,
    items: [{ label: "Talents", href: routes.talents }],
  },
  {
    label: "Rotations",
    href: routes.rotations.index,
    icon: Swords,
    items: [
      { label: "Browse", href: routes.rotations.index },
      { label: "Create", href: routes.rotations.editor },
    ],
  },
  {
    label: "Lab",
    href: routes.lab.index,
    icon: FlaskConical,
    items: [
      { label: "Overview", href: routes.lab.index },
      { label: "Data Inspector", href: routes.lab.inspector },
    ],
  },
];

export const navSecondary: MenuItem[] = [
  { label: "Docs", href: routes.docs, icon: BookOpen },
];
