import type { LucideIcon } from "lucide-react";

import {
  BookOpen,
  Calculator,
  FlaskConical,
  Newspaper,
  Play,
  Swords,
} from "lucide-react";

import { routes } from "./routes";

export type MenuItem = {
  label: string;
  href: string;
  icon: Icon;
  external?: boolean;
};

export type MenuNavItem = {
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

export const navMain: MenuNavItem[] = [
  {
    href: routes.simulate,
    icon: Play,
    items: [
      { href: "/TBD1", label: "Quick Sim" },
      { href: "/TBD2", label: "Optimize" },
      { href: "/TBD3", label: "Rankings" },
    ],
    label: "Simulate",
  },
  {
    href: "/TBD4",
    icon: Calculator,
    items: [{ href: "/TBD5", label: "Talents" }],
    label: "Plan",
  },
  {
    href: "/TBD6",
    icon: Swords,
    items: [
      { href: "/TBD7", label: "Browse" },
      { href: "/TBD8", label: "Create" },
    ],
    label: "Rotations",
  },
  {
    href: "/TBD8",
    icon: FlaskConical,
    items: [
      { href: "/TBD10", label: "Overview" },
      { href: "/TBD11", label: "Data Inspector" },
    ],
    label: "Lab",
  },
];

export const navSecondary: MenuItem[] = [
  { href: routes.docs.index, icon: BookOpen, label: "Docs" },
  { href: routes.blog.index, icon: Newspaper, label: "Blog" },
];
