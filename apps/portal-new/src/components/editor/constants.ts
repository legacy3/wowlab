import { BoxIcon, ListIcon, type LucideIcon, SparklesIcon } from "lucide-react";

import type { ActionType, ListType } from "./types";

export interface ActionTypeConfig {
  description?: string;
  icon: LucideIcon;
  label: string;
  value: ActionType;
}

export const ACTION_TYPES: ActionTypeConfig[] = [
  {
    description: "Cast a spell",
    icon: SparklesIcon,
    label: "Spell",
    value: "spell",
  },
  { description: "Use an item", icon: BoxIcon, label: "Item", value: "item" },
  {
    description: "Execute another action list",
    icon: ListIcon,
    label: "Call List",
    value: "call_action_list",
  },
];

export const ACTION_TYPE_MAP = Object.fromEntries(
  ACTION_TYPES.map((t) => [t.value, t]),
) as Record<ActionType, ActionTypeConfig>;

export interface ListTypeConfig {
  badgeColor: string;
  color: string;
  label: string;
  value: ListType;
}

export const LIST_TYPES: ListTypeConfig[] = [
  {
    badgeColor: "amber",
    color: "amber.500",
    label: "Pre-combat",
    value: "precombat",
  },
  { badgeColor: "green", color: "green.500", label: "Main", value: "main" },
  { badgeColor: "gray", color: "fg.muted", label: "Sub-list", value: "sub" },
];

export const LIST_TYPE_MAP = Object.fromEntries(
  LIST_TYPES.map((t) => [t.value, t]),
) as Record<ListType, ListTypeConfig>;
