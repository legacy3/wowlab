# Phase 5: Portal Data Layer

## Context

You are building the portal data layer to query flat tables (`spell_data_flat`, `talent_tree_flat`, `item_data_flat`, `aura_data_flat`) via Supabase JS client.

## Prerequisites

- Phase 1-2 completed: Flat tables exist and have data
- Portal exists at `apps/portal/`

## Project Structure

```
apps/portal/
└── src/
    ├── hooks/       # Query hooks
    ├── types/       # Flat types
    └── components/  # Use hooks
```

## Objectives

1. Create query hooks for flat tables
2. Add TypeScript types matching flat table schemas
3. Optional: Generate types from database schema

## TypeScript Types

```typescript
// apps/portal/src/types/flat.ts

export interface SpellEffect {
  effect_index: number;
  effect_type: number;
  effect_aura: number;
  mechanic: number;
  implicit_target_a: number;
  implicit_target_b: number;
  radius_min: number;
  radius_max: number;
  chain_targets: number;
  base_points: number;
  misc_value_a: number;
  misc_value_b: number;
  trigger_spell_id: number | null;
  amplitude_ms: number;
  coefficient: number;
  variance: number;
  resource_coefficient: number;
  bonus_coefficient: number;
  chain_amplitude: number;
  ap_coefficient: number;
  sp_coefficient: number;
  pvp_coefficient: number;
  pos_facing: number | null;
}

export interface RppmModifier {
  type: number;
  param: number;
  coefficient: number;
}

export interface SpellDataFlat {
  id: number;
  name: string;
  description: string | null;
  tooltip: string | null;
  aura_description: string | null;
  cast_time_ms: number;
  gcd_ms: number;
  gcd_category: number;
  cooldown_ms: number;
  cooldown_category: number;
  charges: number;
  charge_cooldown_ms: number;
  power_type: number;
  power_cost: number;
  power_cost_per_second: number;
  power_cost_pct: number;
  optional_power_type: number | null;
  optional_power_cost: number | null;
  min_range: number;
  max_range: number;
  effects: SpellEffect[];
  spell_school_mask: number;
  mechanic: number;
  attributes: number[];
  duration_ms: number;
  max_stacks: number;
  proc_chance: number;
  proc_charges: number;
  proc_flags: number;
  internal_cooldown_ms: number;
  rppm_base: number;
  rppm_modifiers: RppmModifier[];
  scaling_type: number;
  scaling_class: number;
  spell_class_set: number;
  spell_class_mask: number[];
  icon_file_data_id: number;
  active_icon_file_data_id: number | null;
  rank_text: string | null;
  spell_family: number;
  base_damage: number;
  ap_coefficient: number;
  sp_coefficient: number;
  patch_version: string;
  updated_at: string;
}

export interface ChoiceEntry {
  choice_index: number;
  spell_id: number;
  spell_name: string;
}

export interface TalentNodeFlat {
  node_id: number;
  row: number;
  col: number;
  max_ranks: number;
  node_type: number;
  spell_id: number;
  spell_name: string;
  unlocks: number[];
  locked_by: number[];
  sub_tree_id: number | null;
  pos_x: number;
  pos_y: number;
  choice_entries: ChoiceEntry[] | null;
}

export interface SubTreeFlat {
  sub_tree_id: number;
  name: string;
  icon_file_data_id: number;
  trait_currency_id: number;
}

export interface TalentTreeFlat {
  id: number;
  spec_id: number;
  spec_name: string;
  class_id: number;
  class_name: string;
  tree_id: number;
  nodes: TalentNodeFlat[];
  sub_trees: SubTreeFlat[];
  class_nodes: TalentNodeFlat[];
  patch_version: string;
  updated_at: string;
}

export interface ItemStat {
  stat_type: number;
  value: number;
  allocation: number;
  socket_multiplier: number;
}

export interface ItemEffect {
  spell_id: number;
  trigger_type: number;
  cooldown_ms: number;
  cooldown_category: number;
  charges: number;
}

export interface ItemDataFlat {
  id: number;
  name: string;
  description: string | null;
  item_level: number;
  required_level: number;
  quality: number;
  inventory_type: number;
  class_id: number;
  subclass_id: number;
  class_mask: number;
  race_mask: number;
  stats: ItemStat[];
  effects: ItemEffect[];
  socket_count: number;
  socket_bonus_stat: number | null;
  gem_properties: number | null;
  icon_file_data_id: number;
  max_count: number;
  stackable: number;
  vendor_price: number;
  flags: number[];
  patch_version: string;
  updated_at: string;
}

export interface AuraDataFlat {
  spell_id: number;
  name: string;
  description: string | null;
  duration_ms: number;
  max_stacks: number;
  proc_chance: number;
  proc_charges: number;
  proc_flags: number;
  internal_cooldown_ms: number;
  rppm_base: number;
  rppm_modifiers: RppmModifier[];
  effects: SpellEffect[];
  is_buff: boolean;
  is_debuff: boolean;
  is_passive: boolean;
  dispel_type: number;
  mechanic: number;
  icon_file_data_id: number;
  patch_version: string;
  updated_at: string;
}

export interface SpellSummary {
  id: number;
  name: string;
  icon_file_data_id: number;
}

export interface ItemSummary {
  id: number;
  name: string;
  item_level: number;
  quality: number;
  icon_file_data_id: number;
}
```

## Hooks

```typescript
// apps/portal/src/hooks/use-spell.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { SpellDataFlat, SpellSummary } from '@/types/flat';

export function useSpell(id: number) {
  return useQuery({
    queryKey: ['spell', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spell_data_flat')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as SpellDataFlat;
    },
  });
}

export function useSpellSummary(id: number) {
  return useQuery({
    queryKey: ['spell-summary', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spell_data_flat')
        .select('id, name, icon_file_data_id')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as SpellSummary;
    },
  });
}

export function useSpells(ids: number[]) {
  return useQuery({
    queryKey: ['spells', ids],
    queryFn: async () => {
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from('spell_data_flat')
        .select('*')
        .in('id', ids);
      if (error) throw error;
      return data as SpellDataFlat[];
    },
    enabled: ids.length > 0,
  });
}

export function useSpellSearch(query: string) {
  return useQuery({
    queryKey: ['spell-search', query],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spell_data_flat')
        .select('id, name, icon_file_data_id')
        .ilike('name', `%${query}%`)
        .limit(20);
      if (error) throw error;
      return data as SpellSummary[];
    },
    enabled: query.length > 2,
  });
}
```

```typescript
// apps/portal/src/hooks/use-talent-tree.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { TalentTreeFlat } from '@/types/flat';

export function useTalentTree(specId: number) {
  return useQuery({
    queryKey: ['talent-tree', specId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('talent_tree_flat')
        .select('*')
        .eq('spec_id', specId)
        .single();
      if (error) throw error;
      return data as TalentTreeFlat;
    },
  });
}

export function useClassTalentTrees(classId: number) {
  return useQuery({
    queryKey: ['talent-trees', classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('talent_tree_flat')
        .select('*')
        .eq('class_id', classId);
      if (error) throw error;
      return data as TalentTreeFlat[];
    },
  });
}
```

```typescript
// apps/portal/src/hooks/use-item.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ItemDataFlat, ItemSummary } from '@/types/flat';

export function useItem(id: number) {
  return useQuery({
    queryKey: ['item', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('item_data_flat')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as ItemDataFlat;
    },
  });
}

export function useItemsByLevel(minLevel: number, maxLevel: number) {
  return useQuery({
    queryKey: ['items-by-level', minLevel, maxLevel],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('item_data_flat')
        .select('id, name, item_level, quality, icon_file_data_id')
        .gte('item_level', minLevel)
        .lte('item_level', maxLevel)
        .order('item_level', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as ItemSummary[];
    },
  });
}

export function useItemSearch(query: string) {
  return useQuery({
    queryKey: ['item-search', query],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('item_data_flat')
        .select('id, name, item_level, quality, icon_file_data_id')
        .ilike('name', `%${query}%`)
        .limit(20);
      if (error) throw error;
      return data as ItemSummary[];
    },
    enabled: query.length > 2,
  });
}
```

```typescript
// apps/portal/src/hooks/use-aura.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { AuraDataFlat } from '@/types/flat';

export function useAura(spellId: number) {
  return useQuery({
    queryKey: ['aura', spellId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('aura_data_flat')
        .select('*')
        .eq('spell_id', spellId)
        .single();
      if (error) throw error;
      return data as AuraDataFlat;
    },
  });
}
```

## Type Generation (Optional)

```bash
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

## Checklist

- [ ] Create `src/types/flat.ts` with all types
- [ ] Create `useSpell` hook
- [ ] Create `useSpells` batch hook
- [ ] Create `useSpellSearch` hook
- [ ] Create `useTalentTree` hook
- [ ] Create `useClassTalentTrees` hook
- [ ] Create `useItem` hook
- [ ] Create `useItemsByLevel` hook
- [ ] Create `useItemSearch` hook
- [ ] Create `useAura` hook
- [ ] Test all hooks
- [ ] Set up type generation (optional)

## Success Criteria

1. `pnpm build` succeeds
2. All hooks return correct data
3. Search works
4. Types match database schema
