import { atom } from "jotai";
import { atomWithRefresh } from "jotai/utils";
import { supabaseClientAtom } from "@/atoms/supabase";

// Minimal spell shape used by portal; aligns with Supabase rows.
export type SpellDataFlat = { id: number; name: string } & Record<
  string,
  unknown
>;

export const spellListAtom = atomWithRefresh(async (get) => {
  const supabase = get(supabaseClientAtom);
  const batchSize = 1000;

  let allSpells: Array<{ id: number; name: string }> = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("spell_data")
      .select("id, name")
      .order("name")
      .range(from, from + batchSize - 1);

    if (error) {
      throw new Error(`Failed to fetch spell list: ${error.message}`);
    }

    if (!data || data.length === 0) {
      break;
    }

    allSpells = [...allSpells, ...data];

    if (data.length < batchSize) {
      break;
    }

    from += batchSize;
  }

  return allSpells;
});

export const selectedSpellIdAtom = atom<number | null>(null);

export const selectedSpellAtom = atom(async (get) => {
  const spellId = get(selectedSpellIdAtom);
  if (spellId === null) {
    return null;
  }

  const supabase = get(supabaseClientAtom);
  const { data, error } = await supabase
    .from("spell_data")
    .select("*")
    .eq("id", spellId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch spell data: ${error.message}`);
  }

  // Data is already SpellDataFlat - cast to branded type
  return data as unknown as SpellDataFlat;
});
