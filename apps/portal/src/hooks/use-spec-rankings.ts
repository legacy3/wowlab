import type { SpecRankingRow } from "@/lib/supabase/types";
import { useSupabaseView } from "./use-supabase-view";

export function useSpecRankings() {
  return useSupabaseView<SpecRankingRow>("view_spec_rankings_hourly", [
    { field: "avgDps", order: "desc" },
  ]);
}
