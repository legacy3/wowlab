import type { BaseRecord, CrudFilter, DataProvider } from "@refinedev/core";
import type { QueryClient } from "@tanstack/react-query";

import { DbcQueryError } from "@wowlab/core/Errors";
import type { DbcRow, DbcTableName } from "@wowlab/core/DbcTableRegistry";
import { DbcBatchFetcher, DbcServiceLive } from "@wowlab/services/Data";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import { dbcKeys } from "./dbc-keys";

const RAW_DBC_SCHEMA = "raw_dbc";

const getRowId = (row: unknown): number | null => {
  if (typeof row !== "object" || row === null) {
    return null;
  }

  if (!("ID" in row)) {
    return null;
  }

  const id = (row as { ID: unknown }).ID;
  return typeof id === "number" ? id : null;
};

const fetchByIds = <T extends BaseRecord>(
  queryClient: QueryClient,
  dataProvider: DataProvider,
  resource: string,
  ids: readonly number[],
): Effect.Effect<T[], DbcQueryError> =>
  Effect.tryPromise({
    catch: (cause) =>
      new DbcQueryError({
        cause,
        message: `Failed to batch fetch ${resource} with IDs [${ids.slice(0, 5).join(", ")}${ids.length > 5 ? "..." : ""}]`,
      }),
    try: () => {
      if (ids.length === 0) {
        return Promise.resolve([]);
      }

      return dataProvider
        .getList<T>({
          resource,
          filters: [{ field: "ID", operator: "in", value: ids }],
          pagination: { mode: "off" },
          meta: { schema: RAW_DBC_SCHEMA, idColumnName: "ID" },
        })
        .then((result) => {
          for (const row of result.data) {
            const id = getRowId(row);
            if (id != null) {
              queryClient.setQueryData(dbcKeys.one(resource, id), row);
            }
          }

          return result.data;
        });
    },
  });

const fetchByFk = <T extends BaseRecord>(
  queryClient: QueryClient,
  dataProvider: DataProvider,
  resource: string,
  fkField: string,
  fkValues: readonly number[],
): Effect.Effect<T[], DbcQueryError> =>
  Effect.tryPromise({
    catch: (cause) =>
      new DbcQueryError({
        cause,
        message: `Failed to batch fetch ${resource} by ${fkField}`,
      }),
    try: () => {
      if (fkValues.length === 0) {
        return Promise.resolve([]);
      }

      const sortedValues = [...fkValues].sort((a, b) => a - b);
      const filters: CrudFilter[] = [
        { field: fkField, operator: "in", value: sortedValues },
      ];
      const cacheKey = dbcKeys.list(resource, filters);

      return queryClient
        .fetchQuery({
          queryKey: cacheKey,
          queryFn: () =>
            dataProvider
              .getList<T>({
                resource,
                filters,
                pagination: { mode: "off" },
                meta: { schema: RAW_DBC_SCHEMA, idColumnName: "ID" },
              })
              .then((result) => result.data),
        })
        .then((rows) => {
          for (const row of rows) {
            const id = getRowId(row);
            if (id != null) {
              queryClient.setQueryData(dbcKeys.one(resource, id), row);
            }
          }

          return rows;
        });
    },
  });

const fetchAll = <T extends BaseRecord>(
  queryClient: QueryClient,
  dataProvider: DataProvider,
  resource: string,
): Effect.Effect<T[], DbcQueryError> =>
  Effect.tryPromise({
    catch: (cause) =>
      new DbcQueryError({
        cause,
        message: `Failed to fetch all ${resource}`,
      }),
    try: () => {
      const cacheKey = dbcKeys.list(resource, []);

      return queryClient.fetchQuery({
        queryKey: cacheKey,
        queryFn: () =>
          dataProvider
            .getList<T>({
              resource,
              pagination: { mode: "off" },
              meta: { schema: RAW_DBC_SCHEMA, idColumnName: "ID" },
            })
            .then((result) => result.data),
      });
    },
  });

const createBatchFetcher = (
  queryClient: QueryClient,
  dataProvider: DataProvider,
): Layer.Layer<DbcBatchFetcher> =>
  Layer.succeed(DbcBatchFetcher, {
    fetchAll: <Table extends DbcTableName>(table: Table) =>
      fetchAll<DbcRow<Table> & BaseRecord>(queryClient, dataProvider, table),

    fetchByFks: <
      Table extends DbcTableName,
      FK extends keyof DbcRow<Table> & string,
    >(
      table: Table,
      fkField: FK,
      fkValues: readonly number[],
    ) =>
      fetchByFk<DbcRow<Table> & BaseRecord>(
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
      fetchByIds<DbcRow<Table> & BaseRecord>(
        queryClient,
        dataProvider,
        table,
        ids,
      ),
  });

export const RefineDbcService = (
  queryClient: QueryClient,
  dataProvider: DataProvider,
) =>
  DbcServiceLive.pipe(
    Layer.provide(createBatchFetcher(queryClient, dataProvider)),
  );
