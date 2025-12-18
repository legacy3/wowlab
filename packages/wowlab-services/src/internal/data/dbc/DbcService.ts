import type { DbcRow, DbcTableName } from "@wowlab/core/DbcTableRegistry";

import { DbcError } from "@wowlab/core/Errors";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import { GetDbcById, GetDbcManyByFk, GetDbcOneByFk } from "./DbcRequests.js";
import { DbcBatchFetcher, makeDbcRequestResolvers } from "./DbcResolvers.js";

export interface DbcServiceInterface {
  readonly getAll: <Table extends DbcTableName>(
    table: Table,
  ) => Effect.Effect<ReadonlyArray<DbcRow<Table>>, DbcError>;

  readonly getById: <Table extends DbcTableName>(
    table: Table,
    id: number,
  ) => Effect.Effect<DbcRow<Table> | undefined, DbcError>;

  readonly getManyByFk: <
    Table extends DbcTableName,
    FK extends keyof DbcRow<Table> & string,
  >(
    table: Table,
    fkField: FK,
    fkValue: number,
  ) => Effect.Effect<ReadonlyArray<DbcRow<Table>>, DbcError>;

  readonly getManyByFkValues: <
    Table extends DbcTableName,
    FK extends keyof DbcRow<Table> & string,
  >(
    table: Table,
    fkField: FK,
    fkValues: readonly number[],
  ) => Effect.Effect<ReadonlyArray<DbcRow<Table>>, DbcError>;

  readonly getManyByIds: <Table extends DbcTableName>(
    table: Table,
    ids: readonly number[],
  ) => Effect.Effect<
    ReadonlyArray<{ readonly ID: number } & DbcRow<Table>>,
    DbcError
  >;

  readonly getOneByFk: <
    Table extends DbcTableName,
    FK extends keyof DbcRow<Table> & string,
  >(
    table: Table,
    fkField: FK,
    fkValue: number,
  ) => Effect.Effect<DbcRow<Table> | undefined, DbcError>;
}

export class DbcService extends Context.Tag("@wowlab/services/DbcService")<
  DbcService,
  DbcServiceInterface
>() {}

export const DbcServiceLive: Layer.Layer<DbcService, never, DbcBatchFetcher> =
  Layer.effect(
    DbcService,
    Effect.gen(function* () {
      const fetcher = yield* DbcBatchFetcher;
      const resolvers = makeDbcRequestResolvers(fetcher);

      return {
        getAll: (table) => fetcher.fetchAll(table),

        getById: (table, id) =>
          Effect.request(new GetDbcById({ id, table }), resolvers.byId),

        getManyByFk: (table, fkField, fkValue) =>
          Effect.request(
            new GetDbcManyByFk({ fkField, fkValue, table }),
            resolvers.manyByFk,
          ),

        getManyByFkValues: (table, fkField, fkValues) =>
          fetcher.fetchByFks(table, fkField, fkValues),

        getManyByIds: (table, ids) => fetcher.fetchByIds(table, ids),

        getOneByFk: (table, fkField, fkValue) =>
          Effect.request(
            new GetDbcOneByFk({ fkField, fkValue, table }),
            resolvers.oneByFk,
          ),
      } satisfies DbcServiceInterface;
    }),
  );
