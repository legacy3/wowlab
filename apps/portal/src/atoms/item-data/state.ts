import { atom } from "jotai";
import { atomFamily } from "jotai/utils";
// import type { ItemDataFlat } from "@packages/innocent-schemas/Item";
import { supabaseClientAtom } from "@/atoms/supabase";

export const itemAtomFamily = atomFamily((itemId: number) =>
  atom(async (get) => {
    const supabase = get(supabaseClientAtom);
    const { data, error } = await supabase
      .from("item_data")
      .select("*")
      .eq("id", itemId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch item ${itemId}: ${error.message}`);
    }

    // Temporarily disabled - type mismatch
    // return data as ItemDataFlat;
    return data;
  }),
);
