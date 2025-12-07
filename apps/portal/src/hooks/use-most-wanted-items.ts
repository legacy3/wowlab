import { useList } from "@refinedev/core";
import type { MostWantedItem } from "@/lib/supabase/types";

export function useMostWantedItems() {
  return useList<MostWantedItem>({
    resource: "view_most_wanted_items",
    sorters: [{ field: "rank", order: "asc" }],
    pagination: { pageSize: 10 },
  });
}
