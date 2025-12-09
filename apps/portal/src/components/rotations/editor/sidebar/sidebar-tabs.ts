import { Book, Wand2, Code2, Database, type LucideIcon } from "lucide-react";

export type TabId = "api" | "spells" | "snippets" | "data";

export interface SidebarTabConfig {
  id: TabId;
  label: string;
  icon: LucideIcon;
}

export const SIDEBAR_TABS: SidebarTabConfig[] = [
  { id: "api", label: "API Reference", icon: Book },
  { id: "spells", label: "Spells", icon: Wand2 },
  { id: "snippets", label: "Snippets", icon: Code2 },
  { id: "data", label: "Data Inspector", icon: Database },
];

export const DEFAULT_TAB: TabId = "spells";
