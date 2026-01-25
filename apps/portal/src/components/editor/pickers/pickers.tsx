"use client";

import type { Item, ItemSummary, Spell, SpellSummary } from "@/lib/supabase";

import { items, spells, useResource, useResourceList } from "@/lib/refine";

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

function useItemSearchWrapper(opts: { query: string }) {
  const result = useResourceList<ItemSummary>({
    ...items,
    filters: [{ field: "name", operator: "contains", value: opts.query }],
    meta: { ...items.meta, select: "id, name, item_level, quality, file_name" },
    pagination: { currentPage: 1, pageSize: 20 },
    queryOptions: { enabled: opts.query.length > 2 },
  });
  return { data: result.data ?? [], isLoading: result.isLoading };
}

function useItemWrapper(id: number | null | undefined) {
  const result = useResource<Item>({
    ...items,
    id: id ?? "",
    queryOptions: { enabled: id != null },
  });
  return { data: result.data ?? null, isLoading: result.isLoading };
}

function useSpellSearchWrapper(opts: { query: string }) {
  const result = useResourceList<SpellSummary>({
    ...spells,
    filters: [{ field: "name", operator: "contains", value: opts.query }],
    meta: { ...spells.meta, select: "id, name, file_name" },
    pagination: { currentPage: 1, pageSize: 20 },
    queryOptions: { enabled: opts.query.length > 2 },
  });
  return { data: result.data ?? [], isLoading: result.isLoading };
}

function useSpellWrapper(id: number | null | undefined) {
  const result = useResource<Spell>({
    ...spells,
    id: id ?? "",
    queryOptions: { enabled: id != null },
  });
  return { data: result.data ?? null, isLoading: result.isLoading };
}

// Configs
const SPELL_CONFIG: GameObjectPickerConfig<SpellSummary, Spell> = {
  emptyMessage: "No spells found",
  getIconName: (data) => data.file_name,
  getId: (item) => item.id,
  getLabel: (item) => item.name ?? `Spell #${item.id}`,
  getName: (data) => data.name,
  noun: "Spell",
  searchPlaceholder: "Search spells...",
  selectPlaceholder: "Select spell...",
  useData: useSpellWrapper,
  useSearch: useSpellSearchWrapper,
};

const ITEM_CONFIG: GameObjectPickerConfig<ItemSummary, Item> = {
  emptyMessage: "No items found",
  getIconName: (data) => data.file_name,
  getId: (item) => item.id,
  getLabel: (item) => item.name ?? `Item #${item.id}`,
  getName: (data) => data.name,
  noun: "Item",
  searchPlaceholder: "Search items...",
  selectPlaceholder: "Select item...",
  useData: useItemWrapper,
  useSearch: useItemSearchWrapper,
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
