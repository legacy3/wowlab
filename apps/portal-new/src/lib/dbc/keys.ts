import type { CrudFilter } from "@refinedev/core";

export const dbcKeys = {
  all: ["dbc"] as const,

  list: (resource: string, filters: CrudFilter[]) =>
    [...dbcKeys.all, resource, "list", filters] as const,

  one: (resource: string, id: number) =>
    [...dbcKeys.all, resource, "one", id] as const,
};
