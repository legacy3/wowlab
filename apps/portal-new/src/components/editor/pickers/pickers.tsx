"use client";

import type { Item as ItemType, Spell } from "@wowlab/core/Schemas";

import type { ItemSearchResult, SpellSearchResult } from "@/lib/state";

import { useItem, useItemSearch, useSpell, useSpellSearch } from "@/lib/state";

import {
  GameObjectPicker,
  type GameObjectPickerConfig,
} from "./game-object-picker";

// Shared props interface for all pickers
interface PickerProps {
  onSelect: (id: number, name: string) => void;
  placeholder?: string;
  value?: number | null;
  variant?: "inline" | "input";
}

// Configs
const SPELL_CONFIG: GameObjectPickerConfig<
  SpellSearchResult,
  Spell.SpellDataFlat
> = {
  emptyMessage: "No spells found",
  getIconName: (data) => data.fileName,
  getId: (item) => item.ID,
  getLabel: (item) => item.Name_lang ?? `Spell #${item.ID}`,
  getName: (data) => data.name,
  noun: "Spell",
  searchPlaceholder: "Search spells...",
  selectPlaceholder: "Select spell...",
  useData: useSpell,
  useSearch: useSpellSearch,
};

const ITEM_CONFIG: GameObjectPickerConfig<
  ItemSearchResult,
  ItemType.ItemDataFlat
> = {
  emptyMessage: "No items found",
  getIconName: (data) => data.fileName,
  getId: (item) => item.ID,
  getLabel: (item) => item.Display_lang ?? `Item #${item.ID}`,
  getName: (data) => data.name,
  noun: "Item",
  searchPlaceholder: "Search items...",
  selectPlaceholder: "Select item...",
  useData: useItem,
  useSearch: useItemSearch,
};

export function ItemPicker({
  onSelect,
  placeholder,
  value,
  variant = "input",
}: PickerProps) {
  return (
    <GameObjectPicker
      config={ITEM_CONFIG}
      onSelect={onSelect}
      placeholder={placeholder}
      value={value}
      variant={variant}
    />
  );
}

// Picker components
export function SpellPicker({
  onSelect,
  placeholder,
  value,
  variant = "input",
}: PickerProps) {
  return (
    <GameObjectPicker
      config={SPELL_CONFIG}
      onSelect={onSelect}
      placeholder={placeholder}
      value={value}
      variant={variant}
    />
  );
}

export type { PickerProps as ItemPickerProps, PickerProps as SpellPickerProps };
