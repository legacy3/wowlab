import type { SupabaseClient } from "@supabase/supabase-js";
import type * as Schemas from "@wowlab/core/Schemas";

export const loadSpells = async (
  supabase: SupabaseClient,
  spellIds: number[],
): Promise<Schemas.Spell.SpellDataFlat[]> => {
  if (spellIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("spell_data")
    .select("*")
    .in("id", spellIds);

  if (error) {
    throw new Error(`Failed to fetch spell data: ${error.message}`);
  }

  if (!data) {
    throw new Error("No spell data returned from Supabase");
  }

  // Verify we got all requested spells
  const missingIds = spellIds.filter(
    (id) => !data.some((spell) => spell.id === id),
  );
  if (missingIds.length > 0) {
    throw new Error(
      `Spell IDs not found in database: ${missingIds.join(", ")}`,
    );
  }

  // Data from Supabase matches SpellDataFlat schema
  return data as unknown as Schemas.Spell.SpellDataFlat[];
};
