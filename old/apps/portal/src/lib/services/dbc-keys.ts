import type { CrudFilter } from "@refinedev/core";

const DATA_PROVIDER = "default";
const SCHEMA = "raw_dbc";

export const dbcKeys = {
  one: (resource: string, id: number) =>
    [
      "data",
      DATA_PROVIDER,
      resource,
      "one",
      { id, meta: { schema: SCHEMA, idColumnName: "ID" } },
    ] as const,

  list: (resource: string, filters: CrudFilter[]) =>
    [
      "data",
      DATA_PROVIDER,
      resource,
      "list",
      {
        filters,
        pagination: { mode: "off" },
        meta: { schema: SCHEMA, idColumnName: "ID" },
      },
    ] as const,
};
