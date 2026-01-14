"use client";

import type { MostWantedItem } from "@/lib/supabase/types";
import { useSupabaseView } from "./use-supabase-view";

export function useMostWantedItems() {
  return useSupabaseView<MostWantedItem>("view_most_wanted_items", [
    { field: "rank", order: "asc" },
  ]);
}
