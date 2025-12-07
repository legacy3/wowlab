import { useList } from "@refinedev/core";
import type { SpecRankingRow } from "@/lib/supabase/types";

export function useSpecRankings() {
  return useList<SpecRankingRow>({
    resource: "view_spec_rankings_hourly",
    sorters: [{ field: "avgDps", order: "desc" }],
    pagination: { pageSize: 10 },
  });
}
