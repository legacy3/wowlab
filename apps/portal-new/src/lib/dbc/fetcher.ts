import type { BaseRecord, CrudFilter, DataProvider } from "@refinedev/core";
import type { QueryClient } from "@tanstack/react-query";
import type { DbcRow, DbcTableName } from "@wowlab/core/DbcTableRegistry";

import { DbcQueryError } from "@wowlab/core/Errors";
import { DbcBatchFetcher, DbcServiceLive } from "@wowlab/services/Data";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import { dbcKeys } from "./keys";

const DBC_META = { idColumnName: "ID", schema: "raw_dbc" } as const;

const dbcEffect = <T>(message: string, fn: () => Promise<T>) =>
  Effect.tryPromise({
    catch: (cause) => new DbcQueryError({ cause, message }),
    try: fn,
  });

const getRowId = (row: unknown): number | null => {
  if (typeof row !== "object" || row === null || !("ID" in row)) {
    return null;
  }

  const id = (row as { ID: unknown }).ID;

  return typeof id === "number" ? id : null;
};

const cacheRows = <T extends BaseRecord>(
  queryClient: QueryClient,
  resource: string,
  rows: T[],
): T[] => {
  for (const row of rows) {
    const id = getRowId(row);

    if (id != null) {
      queryClient.setQueryData(dbcKeys.one(resource, id), row);
    }
  }
  return rows;
};

const fetchByIds = <T extends BaseRecord>(
  queryClient: QueryClient,
  dataProvider: DataProvider,
  resource: string,
  ids: readonly number[],
): Effect.Effect<T[], DbcQueryError> =>
  dbcEffect(`Failed to fetch ${resource} by IDs`, async () => {
    if (ids.length === 0) {
      return [];
    }

    const result = await dataProvider.getList<T>({
      filters: [{ field: "ID", operator: "in", value: ids }],
      meta: DBC_META,
      pagination: { mode: "off" },
      resource,
    });

    return cacheRows(queryClient, resource, result.data);
  });

const fetchByFk = <T extends BaseRecord>(
  queryClient: QueryClient,
  dataProvider: DataProvider,
  resource: string,
  fkField: string,
  fkValues: readonly number[],
): Effect.Effect<T[], DbcQueryError> =>
  dbcEffect(`Failed to fetch ${resource} by ${fkField}`, async () => {
    if (fkValues.length === 0) {
      return [];
    }

    const filters: CrudFilter[] = [
      { field: fkField, operator: "in", value: fkValues },
    ];

    const rows = await queryClient.fetchQuery({
      queryFn: async () => {
        const result = await dataProvider.getList<T>({
          filters,
          meta: DBC_META,
          pagination: { mode: "off" },
          resource,
        });

        return result.data;
      },

      queryKey: dbcKeys.list(resource, filters),
    });

    return cacheRows(queryClient, resource, rows);
  });

const fetchAll = <T extends BaseRecord>(
  queryClient: QueryClient,
  dataProvider: DataProvider,
  resource: string,
): Effect.Effect<T[], DbcQueryError> =>
  dbcEffect(`Failed to fetch all ${resource}`, () =>
    queryClient.fetchQuery({
      queryFn: async () => {
        const result = await dataProvider.getList<T>({
          meta: DBC_META,
          pagination: { mode: "off" },
          resource,
        });

        return result.data;
      },

      queryKey: dbcKeys.list(resource, []),
    }),
  );

const createBatchFetcher = (
  queryClient: QueryClient,
  dataProvider: DataProvider,
): Layer.Layer<DbcBatchFetcher> =>
  Layer.succeed(DbcBatchFetcher, {
    fetchAll: <Table extends DbcTableName>(table: Table) =>
      fetchAll<BaseRecord & DbcRow<Table>>(queryClient, dataProvider, table),

    fetchByFks: <
      Table extends DbcTableName,
      FK extends keyof DbcRow<Table> & string,
    >(
      table: Table,
      fkField: FK,
      fkValues: readonly number[],
    ) =>
      fetchByFk<BaseRecord & DbcRow<Table>>(
        queryClient,
        dataProvider,
        table,
        fkField,
        fkValues,
      ),

    fetchByIds: <Table extends DbcTableName>(
      table: Table,
      ids: readonly number[],
    ) =>
      fetchByIds<BaseRecord & DbcRow<Table>>(
        queryClient,
        dataProvider,
        table,
        ids,
      ),
  });

export const createDbcFetcher = (
  queryClient: QueryClient,
  dataProvider: DataProvider,
) =>
  DbcServiceLive.pipe(
    Layer.provide(createBatchFetcher(queryClient, dataProvider)),
  );
