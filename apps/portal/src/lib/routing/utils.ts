import {
  BookOpen,
  Calculator,
  ChartBar,
  Code,
  Cpu,
  FileText,
  FlaskConical,
  Home,
  Info,
  KeyRound,
  LogIn,
  Newspaper,
  PenLine,
  Play,
  Search,
  Server,
  Settings,
  Shield,
  Sparkles,
  Swords,
  User,
} from "lucide-react";

import type { AnyRoute, DynamicRoute, IconName, Route } from "./types";

const icons = {
  BookOpen,
  Calculator,
  ChartBar,
  Code,
  Cpu,
  FileText,
  FlaskConical,
  Home,
  Info,
  KeyRound,
  LogIn,
  Newspaper,
  PenLine,
  Play,
  Search,
  Server,
  Settings,
  Shield,
  Sparkles,
  Swords,
  User,
} as const;

export function breadcrumb(
  ...items: [...Route[], Route | string]
): { href?: string; label: string }[] {
  return items.map((item, index) => {
    const isLast = index === items.length - 1;
    const label = typeof item === "string" ? item : item.label;
    const path = typeof item === "string" ? undefined : item.path;

    return isLast ? { label } : { href: path, label };
  });
}

export function getIcon(name: IconName) {
  return icons[name];
}
export function href(route: Route): string;
export function href(
  route: DynamicRoute,
  params: Record<string, string>,
): string;

export function href(route: AnyRoute, params?: Record<string, string>): string {
  if ("template" in route) {
    let result = route.template;

    for (const key of route.params) {
      result = result.replace(`:${key}`, params![key]);
    }

    return result;
  }

  return route.path;
}

export { getLocalizedUrl } from "intlayer";
