import { useList } from "@refinedev/core";
import type { TopSimRow } from "@/lib/supabase/types";

export function useTopSims() {
  return useList<TopSimRow>({
    resource: "view_top_sims_daily",
    sorters: [{ field: "dps", order: "desc" }],
    pagination: { pageSize: 10 },
  });
}
