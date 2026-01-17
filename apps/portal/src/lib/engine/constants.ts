import type { LucideIcon } from "lucide-react";
import type { Field } from "react-querybuilder";

import { BoxIcon, ListIcon, SparklesIcon } from "lucide-react";

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

export const OPERATORS = [
  { label: "=", name: "=" },
  { label: "!=", name: "!=" },
  { label: "<", name: "<" },
  { label: "<=", name: "<=" },
  { label: ">", name: ">" },
  { label: ">=", name: ">=" },
];

export interface FieldCategory {
  id: string;
  label: string;
}

export const FIELD_CATEGORIES: FieldCategory[] = [
  { id: "target", label: "Target" },
  { id: "resource", label: "Resources" },
  { id: "buff", label: "Buffs" },
  { id: "debuff", label: "Debuffs" },
  { id: "cooldown", label: "Cooldowns" },
  { id: "combat", label: "Combat State" },
  { id: "encounter", label: "Encounter" },
  { id: "talent", label: "Talents" },
  { id: "variable", label: "Variables" },
  { id: "spell", label: "Spells" },
  { id: "dot", label: "DoTs" },
  { id: "pet", label: "Pet" },
  { id: "totem", label: "Totems" },
  { id: "trinket", label: "Trinkets" },
  { id: "racial", label: "Racials" },
];

export interface ConditionField extends Field {
  category: string;
}

export const CONDITION_FIELDS: ConditionField[] = [
  // Target
  {
    category: "target",
    inputType: "number",
    label: "Target Health %",
    name: "target.health.pct",
  },
  {
    category: "target",
    inputType: "number",
    label: "Target Health",
    name: "target.health.current",
  },
  {
    category: "target",
    inputType: "number",
    label: "Target Max Health",
    name: "target.health.max",
  },
  {
    category: "target",
    inputType: "number",
    label: "Time to Die",
    name: "target.time_to_die",
  },
  {
    category: "target",
    inputType: "number",
    label: "Time to 20%",
    name: "target.time_to_pct_20",
  },
  {
    category: "target",
    inputType: "number",
    label: "Time to 35%",
    name: "target.time_to_pct_35",
  },
  {
    category: "target",
    inputType: "number",
    label: "Distance",
    name: "target.distance",
  },
  {
    category: "target",
    inputType: "text",
    label: "Is Boss",
    name: "target.is_boss",
    values: [
      { label: "Yes", name: "true" },
      { label: "No", name: "false" },
    ],
  },
  {
    category: "target",
    inputType: "number",
    label: "Adds Count",
    name: "target.adds",
  },
  {
    category: "target",
    inputType: "number",
    label: "Target Level",
    name: "target.level",
  },

  // Resource
  {
    category: "resource",
    inputType: "number",
    label: "Resource %",
    name: "resource.pct",
  },
  {
    category: "resource",
    inputType: "number",
    label: "Resource Current",
    name: "resource.current",
  },
  {
    category: "resource",
    inputType: "number",
    label: "Resource Max",
    name: "resource.max",
  },
  {
    category: "resource",
    inputType: "number",
    label: "Resource Deficit",
    name: "resource.deficit",
  },
  {
    category: "resource",
    inputType: "number",
    label: "Combo Points",
    name: "combo_points",
  },
  {
    category: "resource",
    inputType: "number",
    label: "CP Deficit",
    name: "combo_points.deficit",
  },
  {
    category: "resource",
    inputType: "number",
    label: "CP Max",
    name: "combo_points.max",
  },
  {
    category: "resource",
    inputType: "number",
    label: "Holy Power",
    name: "holy_power",
  },
  {
    category: "resource",
    inputType: "number",
    label: "Holy Power Deficit",
    name: "holy_power.deficit",
  },
  {
    category: "resource",
    inputType: "number",
    label: "Soul Shards",
    name: "soul_shards",
  },
  {
    category: "resource",
    inputType: "number",
    label: "Soul Shards Deficit",
    name: "soul_shards.deficit",
  },
  { category: "resource", inputType: "number", label: "Chi", name: "chi" },
  {
    category: "resource",
    inputType: "number",
    label: "Chi Deficit",
    name: "chi.deficit",
  },
  { category: "resource", inputType: "number", label: "Runes", name: "runes" },
  {
    category: "resource",
    inputType: "number",
    label: "Runes Deficit",
    name: "runes.deficit",
  },
  {
    category: "resource",
    inputType: "number",
    label: "Runic Power",
    name: "runic_power",
  },
  {
    category: "resource",
    inputType: "number",
    label: "Runic Power Deficit",
    name: "runic_power.deficit",
  },
  {
    category: "resource",
    inputType: "number",
    label: "Arcane Charges",
    name: "arcane_charges",
  },
  {
    category: "resource",
    inputType: "number",
    label: "Insanity",
    name: "insanity",
  },
  {
    category: "resource",
    inputType: "number",
    label: "Insanity Deficit",
    name: "insanity.deficit",
  },
  {
    category: "resource",
    inputType: "number",
    label: "Maelstrom",
    name: "maelstrom",
  },
  {
    category: "resource",
    inputType: "number",
    label: "Maelstrom Deficit",
    name: "maelstrom.deficit",
  },
  { category: "resource", inputType: "number", label: "Fury", name: "fury" },
  {
    category: "resource",
    inputType: "number",
    label: "Fury Deficit",
    name: "fury.deficit",
  },
  { category: "resource", inputType: "number", label: "Rage", name: "rage" },
  {
    category: "resource",
    inputType: "number",
    label: "Rage Deficit",
    name: "rage.deficit",
  },
  { category: "resource", inputType: "number", label: "Focus", name: "focus" },
  {
    category: "resource",
    inputType: "number",
    label: "Focus Deficit",
    name: "focus.deficit",
  },
  {
    category: "resource",
    inputType: "number",
    label: "Energy",
    name: "energy",
  },
  {
    category: "resource",
    inputType: "number",
    label: "Energy Deficit",
    name: "energy.deficit",
  },
  {
    category: "resource",
    inputType: "number",
    label: "Energy Regen",
    name: "energy.regen",
  },
  {
    category: "resource",
    inputType: "number",
    label: "Energy Time to Max",
    name: "energy.time_to_max",
  },
  {
    category: "resource",
    inputType: "number",
    label: "Mana %",
    name: "mana.pct",
  },
  {
    category: "resource",
    inputType: "number",
    label: "Mana Current",
    name: "mana.current",
  },
  {
    category: "resource",
    inputType: "number",
    label: "Mana Deficit",
    name: "mana.deficit",
  },
  {
    category: "resource",
    inputType: "number",
    label: "Astral Power",
    name: "astral_power",
  },
  {
    category: "resource",
    inputType: "number",
    label: "Astral Power Deficit",
    name: "astral_power.deficit",
  },

  // Buff
  {
    category: "buff",
    inputType: "text",
    label: "Buff Active",
    name: "buff.up",
  },
  {
    category: "buff",
    inputType: "text",
    label: "Buff Inactive",
    name: "buff.down",
  },
  {
    category: "buff",
    inputType: "number",
    label: "Buff Stacks",
    name: "buff.stacks",
  },
  {
    category: "buff",
    inputType: "number",
    label: "Buff Remaining",
    name: "buff.remains",
  },
  {
    category: "buff",
    inputType: "number",
    label: "Buff Duration",
    name: "buff.duration",
  },
  {
    category: "buff",
    inputType: "number",
    label: "Buff Max Stacks",
    name: "buff.max_stacks",
  },
  {
    category: "buff",
    inputType: "text",
    label: "Buff React",
    name: "buff.react",
  },
  {
    category: "buff",
    inputType: "text",
    label: "Buff Refreshable",
    name: "buff.refreshable",
    values: [
      { label: "Yes", name: "true" },
      { label: "No", name: "false" },
    ],
  },

  // Debuff
  {
    category: "debuff",
    inputType: "text",
    label: "Debuff Active",
    name: "debuff.up",
  },
  {
    category: "debuff",
    inputType: "text",
    label: "Debuff Inactive",
    name: "debuff.down",
  },
  {
    category: "debuff",
    inputType: "number",
    label: "Debuff Stacks",
    name: "debuff.stacks",
  },
  {
    category: "debuff",
    inputType: "number",
    label: "Debuff Remaining",
    name: "debuff.remains",
  },
  {
    category: "debuff",
    inputType: "number",
    label: "Debuff Duration",
    name: "debuff.duration",
  },
  {
    category: "debuff",
    inputType: "number",
    label: "Debuff Max Stacks",
    name: "debuff.max_stacks",
  },
  {
    category: "debuff",
    inputType: "text",
    label: "Debuff Refreshable",
    name: "debuff.refreshable",
    values: [
      { label: "Yes", name: "true" },
      { label: "No", name: "false" },
    ],
  },

  // DoT
  { category: "dot", inputType: "text", label: "DoT Active", name: "dot.up" },
  {
    category: "dot",
    inputType: "text",
    label: "DoT Ticking",
    name: "dot.ticking",
  },
  {
    category: "dot",
    inputType: "number",
    label: "DoT Remaining",
    name: "dot.remains",
  },
  {
    category: "dot",
    inputType: "number",
    label: "DoT Duration",
    name: "dot.duration",
  },
  {
    category: "dot",
    inputType: "number",
    label: "DoT Stacks",
    name: "dot.stacks",
  },
  {
    category: "dot",
    inputType: "text",
    label: "DoT Refreshable",
    name: "dot.refreshable",
    values: [
      { label: "Yes", name: "true" },
      { label: "No", name: "false" },
    ],
  },
  {
    category: "dot",
    inputType: "number",
    label: "DoT Ticks Remaining",
    name: "dot.ticks_remain",
  },
  {
    category: "dot",
    inputType: "number",
    label: "DoT Tick Time Remaining",
    name: "dot.tick_time_remains",
  },

  // Cooldown
  {
    category: "cooldown",
    inputType: "text",
    label: "Cooldown Ready",
    name: "cooldown.ready",
  },
  {
    category: "cooldown",
    inputType: "text",
    label: "Cooldown Up",
    name: "cooldown.up",
  },
  {
    category: "cooldown",
    inputType: "text",
    label: "Cooldown Down",
    name: "cooldown.down",
  },
  {
    category: "cooldown",
    inputType: "number",
    label: "Cooldown Remaining",
    name: "cooldown.remains",
  },
  {
    category: "cooldown",
    inputType: "number",
    label: "Cooldown Duration",
    name: "cooldown.duration",
  },
  {
    category: "cooldown",
    inputType: "number",
    label: "Charges",
    name: "charges",
  },
  {
    category: "cooldown",
    inputType: "number",
    label: "Max Charges",
    name: "charges.max",
  },
  {
    category: "cooldown",
    inputType: "number",
    label: "Fractional Charges",
    name: "charges.fractional",
  },
  {
    category: "cooldown",
    inputType: "number",
    label: "Recharge Time",
    name: "recharge_time",
  },
  {
    category: "cooldown",
    inputType: "number",
    label: "Full Recharge Time",
    name: "full_recharge_time",
  },

  // Spell
  {
    category: "spell",
    inputType: "text",
    label: "Spell Usable",
    name: "spell.usable",
  },
  {
    category: "spell",
    inputType: "text",
    label: "Spell Known",
    name: "spell.known",
  },
  {
    category: "spell",
    inputType: "number",
    label: "Spell Cast Time",
    name: "spell.cast_time",
  },
  {
    category: "spell",
    inputType: "number",
    label: "Spell Execute Time",
    name: "spell.execute_time",
  },
  {
    category: "spell",
    inputType: "text",
    label: "Spell In Flight",
    name: "spell.in_flight",
  },
  {
    category: "spell",
    inputType: "text",
    label: "Spell In Flight To Target",
    name: "spell.in_flight_to_target",
  },
  {
    category: "spell",
    inputType: "text",
    label: "Previous GCD",
    name: "prev_gcd",
  },
  {
    category: "spell",
    inputType: "text",
    label: "Previous Off-GCD",
    name: "prev_off_gcd",
  },

  // Combat
  {
    category: "combat",
    inputType: "text",
    label: "In Combat",
    name: "in_combat",
    values: [
      { label: "Yes", name: "true" },
      { label: "No", name: "false" },
    ],
  },
  {
    category: "combat",
    inputType: "text",
    label: "Moving",
    name: "moving",
    values: [
      { label: "Yes", name: "true" },
      { label: "No", name: "false" },
    ],
  },
  {
    category: "combat",
    inputType: "number",
    label: "GCD Remaining",
    name: "gcd.remains",
  },
  {
    category: "combat",
    inputType: "number",
    label: "GCD Max",
    name: "gcd.max",
  },
  {
    category: "combat",
    inputType: "number",
    label: "Cast Time",
    name: "cast.time",
  },
  {
    category: "combat",
    inputType: "number",
    label: "Execute Time",
    name: "execute_time",
  },
  {
    category: "combat",
    inputType: "number",
    label: "Action Execute Time",
    name: "action.execute_time",
  },
  {
    category: "combat",
    inputType: "text",
    label: "Channeling",
    name: "channeling",
    values: [
      { label: "Yes", name: "true" },
      { label: "No", name: "false" },
    ],
  },
  {
    category: "combat",
    inputType: "number",
    label: "Player Health %",
    name: "health.pct",
  },
  {
    category: "combat",
    inputType: "number",
    label: "Player Health",
    name: "health.current",
  },
  {
    category: "combat",
    inputType: "number",
    label: "Player Max Health",
    name: "health.max",
  },
  {
    category: "combat",
    inputType: "number",
    label: "Player Health Deficit",
    name: "health.deficit",
  },

  // Encounter
  {
    category: "encounter",
    inputType: "number",
    label: "Fight Remaining",
    name: "fight.remains",
  },
  {
    category: "encounter",
    inputType: "number",
    label: "Fight Length",
    name: "fight.length",
  },
  {
    category: "encounter",
    inputType: "number",
    label: "Active Enemies",
    name: "active_enemies",
  },
  {
    category: "encounter",
    inputType: "number",
    label: "Spell Targets",
    name: "spell_targets",
  },
  {
    category: "encounter",
    inputType: "number",
    label: "Time in Combat",
    name: "time",
  },
  {
    category: "encounter",
    inputType: "number",
    label: "Time to Bloodlust",
    name: "time_to_bloodlust",
  },
  {
    category: "encounter",
    inputType: "text",
    label: "Bloodlust Active",
    name: "bloodlust.up",
    values: [
      { label: "Yes", name: "true" },
      { label: "No", name: "false" },
    ],
  },

  // Talent
  {
    category: "talent",
    inputType: "text",
    label: "Has Talent",
    name: "talent",
  },
  {
    category: "talent",
    inputType: "text",
    label: "Talent Enabled",
    name: "talent.enabled",
  },
  {
    category: "talent",
    inputType: "number",
    label: "Talent Rank",
    name: "talent.rank",
  },

  // Pet
  {
    category: "pet",
    inputType: "text",
    label: "Pet Active",
    name: "pet.active",
    values: [
      { label: "Yes", name: "true" },
      { label: "No", name: "false" },
    ],
  },
  {
    category: "pet",
    inputType: "number",
    label: "Pet Health %",
    name: "pet.health.pct",
  },
  {
    category: "pet",
    inputType: "text",
    label: "Pet Buff Active",
    name: "pet.buff.up",
  },
  {
    category: "pet",
    inputType: "number",
    label: "Pet Buff Remaining",
    name: "pet.buff.remains",
  },

  // Totem
  {
    category: "totem",
    inputType: "text",
    label: "Totem Active",
    name: "totem.active",
  },
  {
    category: "totem",
    inputType: "number",
    label: "Totem Remaining",
    name: "totem.remains",
  },

  // Trinket
  {
    category: "trinket",
    inputType: "text",
    label: "Trinket 1 Ready",
    name: "trinket.1.cooldown.ready",
    values: [
      { label: "Yes", name: "true" },
      { label: "No", name: "false" },
    ],
  },
  {
    category: "trinket",
    inputType: "number",
    label: "Trinket 1 CD Remaining",
    name: "trinket.1.cooldown.remains",
  },
  {
    category: "trinket",
    inputType: "text",
    label: "Trinket 2 Ready",
    name: "trinket.2.cooldown.ready",
    values: [
      { label: "Yes", name: "true" },
      { label: "No", name: "false" },
    ],
  },
  {
    category: "trinket",
    inputType: "number",
    label: "Trinket 2 CD Remaining",
    name: "trinket.2.cooldown.remains",
  },
  {
    category: "trinket",
    inputType: "text",
    label: "Trinket 1 Has Use Buff",
    name: "trinket.1.has_use_buff",
    values: [
      { label: "Yes", name: "true" },
      { label: "No", name: "false" },
    ],
  },
  {
    category: "trinket",
    inputType: "text",
    label: "Trinket 2 Has Use Buff",
    name: "trinket.2.has_use_buff",
    values: [
      { label: "Yes", name: "true" },
      { label: "No", name: "false" },
    ],
  },

  // Racial
  {
    category: "racial",
    inputType: "text",
    label: "Blood Elf",
    name: "race.blood_elf",
    values: [
      { label: "Yes", name: "true" },
      { label: "No", name: "false" },
    ],
  },
  {
    category: "racial",
    inputType: "text",
    label: "Night Elf",
    name: "race.night_elf",
    values: [
      { label: "Yes", name: "true" },
      { label: "No", name: "false" },
    ],
  },
  {
    category: "racial",
    inputType: "text",
    label: "Troll",
    name: "race.troll",
    values: [
      { label: "Yes", name: "true" },
      { label: "No", name: "false" },
    ],
  },
  {
    category: "racial",
    inputType: "text",
    label: "Orc",
    name: "race.orc",
    values: [
      { label: "Yes", name: "true" },
      { label: "No", name: "false" },
    ],
  },

  // Variable
  {
    category: "variable",
    inputType: "text",
    label: "Variable",
    name: "variable",
  },
];
