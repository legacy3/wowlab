import type { DbcRow, DbcTableName } from "@wowlab/core/DbcTableRegistry";

import { DbcError } from "@wowlab/core/Errors";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Request from "effect/Request";
import * as RequestResolver from "effect/RequestResolver";

import { GetDbcById, GetDbcManyByFk, GetDbcOneByFk } from "./DbcRequests.js";

export interface DbcBatchFetcherInterface {
  readonly fetchAll: <Table extends DbcTableName>(
    table: Table,
  ) => Effect.Effect<ReadonlyArray<DbcRow<Table>>, DbcError>;

  readonly fetchByFks: <
    Table extends DbcTableName,
    FK extends keyof DbcRow<Table> & string,
  >(
    table: Table,
    fkField: FK,
    fkValues: readonly number[],
  ) => Effect.Effect<ReadonlyArray<DbcRow<Table>>, DbcError>;

  readonly fetchByIds: <Table extends DbcTableName>(
    table: Table,
    ids: readonly number[],
  ) => Effect.Effect<
    ReadonlyArray<{ readonly ID: number } & DbcRow<Table>>,
    DbcError
  >;
}

export interface DbcRequestResolvers {
  readonly byId: RequestResolver.RequestResolver<GetDbcById<any>, never>;
  readonly manyByFk: RequestResolver.RequestResolver<
    GetDbcManyByFk<any>,
    never
  >;
  readonly oneByFk: RequestResolver.RequestResolver<GetDbcOneByFk<any>, never>;
}

export class DbcBatchFetcher extends Context.Tag(
  "@wowlab/services/DbcBatchFetcher",
)<DbcBatchFetcher, DbcBatchFetcherInterface>() {}

const completeAllFailed = <Req extends Request.Request<any, any>>(
  requests: ReadonlyArray<Req>,
  error: Request.Request.Error<Req>,
) =>
  Effect.forEach(
    requests,
    (req) =>
      Request.completeEffect(
        req,
        Effect.fail<Request.Request.Error<Req>>(error),
      ),
    { discard: true },
  );

export const makeDbcRequestResolvers = (
  fetcher: DbcBatchFetcherInterface,
): DbcRequestResolvers => {
  const byId = RequestResolver.makeBatched(
    (requests: ReadonlyArray<GetDbcById<any>>) =>
      Effect.gen(function* () {
        const byTable = new Map<DbcTableName, GetDbcById[]>();

        for (const req of requests) {
          const list = byTable.get(req.table) ?? [];
          list.push(req);
          byTable.set(req.table, list);
        }

        yield* Effect.forEach(
          Array.from(byTable.entries()),
          ([table, tableRequests]) =>
            Effect.gen(function* () {
              const ids = [...new Set(tableRequests.map((r) => r.id))];
              if (ids.length === 0) {
                return;
              }

              const rows = yield* fetcher.fetchByIds(table, ids);
              const rowById = new Map<
                number,
                { readonly ID: number } & DbcRow<typeof table>
              >();

              for (const row of rows) {
                rowById.set(row.ID, row);
              }

              for (const req of tableRequests) {
                yield* Request.completeEffect(
                  req,
                  Effect.succeed(rowById.get(req.id)),
                );
              }
            }).pipe(
              Effect.catchAll((error) =>
                completeAllFailed(tableRequests, error),
              ),
            ),
          { concurrency: "unbounded", discard: true },
        );
      }).pipe(Effect.catchAll((error) => completeAllFailed(requests, error))),
  );

  const oneByFk = RequestResolver.makeBatched(
    (requests: ReadonlyArray<GetDbcOneByFk<any>>) =>
      Effect.gen(function* () {
        const byKey = new Map<string, GetDbcOneByFk[]>();

        for (const req of requests) {
          const key = `${req.table}::${req.fkField}`;
          const list = byKey.get(key) ?? [];
          list.push(req);
          byKey.set(key, list);
        }

        yield* Effect.forEach(
          Array.from(byKey.entries()),
          ([_key, group]) =>
            Effect.gen(function* () {
              const table = group[0]!.table;
              const fkField = group[0]!.fkField;

              const fkValues = [...new Set(group.map((r) => r.fkValue))];
              if (fkValues.length === 0) {
                return;
              }

              const rows = yield* fetcher.fetchByFks(table, fkField, fkValues);
              const rowByFk = new Map<number, DbcRow<typeof table>>();

              for (const row of rows) {
                const fk = row[fkField];
                if (typeof fk === "number" && !rowByFk.has(fk)) {
                  rowByFk.set(fk, row);
                }
              }

              for (const req of group) {
                yield* Request.completeEffect(
                  req,
                  Effect.succeed(rowByFk.get(req.fkValue)),
                );
              }
            }).pipe(
              Effect.catchAll((error) => completeAllFailed(group, error)),
            ),
          { concurrency: "unbounded", discard: true },
        );
      }).pipe(Effect.catchAll((error) => completeAllFailed(requests, error))),
  );

  const manyByFk = RequestResolver.makeBatched(
    (requests: ReadonlyArray<GetDbcManyByFk<any>>) =>
      Effect.gen(function* () {
        const byKey = new Map<string, GetDbcManyByFk[]>();

        for (const req of requests) {
          const key = `${req.table}::${req.fkField}`;
          const list = byKey.get(key) ?? [];
          list.push(req);
          byKey.set(key, list);
        }

        yield* Effect.forEach(
          Array.from(byKey.entries()),
          ([_key, group]) =>
            Effect.gen(function* () {
              const table = group[0]!.table;
              const fkField = group[0]!.fkField;

              const fkValues = [...new Set(group.map((r) => r.fkValue))];
              if (fkValues.length === 0) {
                return;
              }

              const rows = yield* fetcher.fetchByFks(table, fkField, fkValues);
              const rowsByFk = new Map<number, Array<DbcRow<typeof table>>>();

              for (const row of rows) {
                const fk = row[fkField];
                if (typeof fk !== "number") {
                  continue;
                }

                const existing = rowsByFk.get(fk) ?? [];
                existing.push(row);
                rowsByFk.set(fk, existing);
              }

              for (const req of group) {
                yield* Request.completeEffect(
                  req,
                  Effect.succeed(rowsByFk.get(req.fkValue) ?? []),
                );
              }
            }).pipe(
              Effect.catchAll((error) => completeAllFailed(group, error)),
            ),
          { concurrency: "unbounded", discard: true },
        );
      }).pipe(Effect.catchAll((error) => completeAllFailed(requests, error))),
  );

  return { byId, manyByFk, oneByFk };
};
