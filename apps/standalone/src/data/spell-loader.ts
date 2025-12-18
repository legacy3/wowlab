import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbcRow, DbcTableName } from "@wowlab/core/DbcTableRegistry";
import type * as Schemas from "@wowlab/core/Schemas";

import { DbcQueryError } from "@wowlab/core/Errors";
import {
  DbcBatchFetcher,
  DbcServiceLive,
  ExtractorService,
  transformAura,
  transformSpell,
} from "@wowlab/services/Data";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

const query = <T>(
  supabase: SupabaseClient,
  table: string,
  fn: (
    builder: ReturnType<ReturnType<SupabaseClient["schema"]>["from"]>,
  ) => PromiseLike<{ data: T | null; error: { message: string } | null }>,
): Effect.Effect<T, DbcQueryError> =>
  Effect.tryPromise({
    catch: (cause) =>
      new DbcQueryError({
        cause,
        message: `Failed to query ${table}`,
      }),
    try: () => fn(supabase.schema("raw_dbc").from(table)),
  }).pipe(
    Effect.flatMap((result) => {
      if (result.error) {
        return Effect.fail(
          new DbcQueryError({
            message: `Query error on ${table}: ${result.error.message}`,
          }),
        );
      }
      return Effect.succeed(result.data as T);
    }),
  );

const SupabaseDbcBatchFetcherLive = (
  supabase: SupabaseClient,
): Layer.Layer<DbcBatchFetcher> =>
  Layer.succeed(DbcBatchFetcher, {
    fetchAll: <Table extends DbcTableName>(table: Table) =>
      query<Array<DbcRow<Table>>>(supabase, table, (builder) =>
        builder.select("*"),
      ),

    fetchByFks: <
      Table extends DbcTableName,
      FK extends keyof DbcRow<Table> & string,
    >(
      table: Table,
      fkField: FK,
      fkValues: readonly number[],
    ) => {
      if (fkValues.length === 0) {
        return Effect.succeed([]);
      }

      // supabase-js types for `.in()` are column-dependent; this is intentionally permissive
      const values: any[] = [...fkValues];

      return query<Array<DbcRow<Table>>>(supabase, table, (builder) =>
        builder.select("*").in(fkField, values),
      );
    },

    fetchByIds: <Table extends DbcTableName>(
      table: Table,
      ids: readonly number[],
    ) => {
      if (ids.length === 0) {
        return Effect.succeed([]);
      }

      return query<Array<DbcRow<Table> & { ID: number }>>(
        supabase,
        table,
        (builder) => builder.select("*").in("ID", [...ids]),
      );
    },
  });

const createSupabaseDbcLayer = (supabase: SupabaseClient) =>
  DbcServiceLive.pipe(Layer.provide(SupabaseDbcBatchFetcherLive(supabase)));

export const loadSpells = (
  supabase: SupabaseClient,
  spellIds: readonly number[],
): Effect.Effect<Schemas.Spell.SpellDataFlat[]> => {
  if (spellIds.length === 0) {
    return Effect.succeed([]);
  }

  const DbcLayer = createSupabaseDbcLayer(supabase);
  const ExtractorLayer = ExtractorService.Default.pipe(Layer.provide(DbcLayer));
  const FullLayer = Layer.merge(DbcLayer, ExtractorLayer);

  return Effect.forEach(spellIds, (spellId) => transformSpell(spellId), {
    concurrency: 10,
    batching: true,
  }).pipe(Effect.provide(FullLayer), Effect.orDie);
};

export const loadAuras = (
  supabase: SupabaseClient,
  spellIds: readonly number[],
): Effect.Effect<Schemas.Aura.AuraDataFlat[]> => {
  if (spellIds.length === 0) {
    return Effect.succeed([]);
  }

  const DbcLayer = createSupabaseDbcLayer(supabase);
  const ExtractorLayer = ExtractorService.Default.pipe(Layer.provide(DbcLayer));
  const FullLayer = Layer.merge(DbcLayer, ExtractorLayer);

  return Effect.forEach(
    spellIds,
    (spellId) => Effect.either(transformAura(spellId)),
    {
      concurrency: 10,
      batching: true,
    },
  ).pipe(
    Effect.map((results) =>
      results.flatMap((r) => (r._tag === "Right" ? [r.right] : [])),
    ),
    Effect.provide(FullLayer),
    Effect.orDie,
  );
};
