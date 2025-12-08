"use client";

import { useList, type CrudSort, type BaseRecord } from "@refinedev/core";

export function useSupabaseView<T extends BaseRecord>(
  resource: string,
  sorters: CrudSort[],
  pageSize = 10,
) {
  return useList<T>({
    resource,
    sorters,
    pagination: { pageSize },
  });
}
