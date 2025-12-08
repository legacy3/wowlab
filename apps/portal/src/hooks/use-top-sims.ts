import type { TopSimRow } from "@/lib/supabase/types";
import { useSupabaseView } from "./use-supabase-view";

export function useTopSims() {
  return useSupabaseView<TopSimRow>("view_top_sims_daily", [
    { field: "dps", order: "desc" },
  ]);
}
