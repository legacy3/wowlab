import { useList } from "@refinedev/core";
import type { WantedItem } from "@/atoms/dps-rankings/state";

export function useMostWantedItems() {
  return useList<WantedItem>({
    resource: "view_most_wanted_items",
    sorters: [{ field: "rank", order: "asc" }],
    pagination: { pageSize: 10 },
  });
}
