"use client";

import type { LucideIcon } from "lucide-react";

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

import type { IconName } from "@/lib/routing";

const icons: Record<IconName, LucideIcon> = {
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
};

export function RouteIcon({ name, size }: { name: IconName; size: number }) {
  const Icon = icons[name];
  return <Icon size={size} />;
}
