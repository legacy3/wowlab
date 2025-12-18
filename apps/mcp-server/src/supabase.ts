import type { DbcRow, DbcTableName } from "@wowlab/core/DbcTableRegistry";
import type * as Schemas from "@wowlab/core/Schemas";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DbcQueryError } from "@wowlab/core/Errors";
import { DbcBatchFetcher, DbcServiceLive } from "@wowlab/services/Data";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import { DEFAULT_SUPABASE_ANON_KEY, DEFAULT_SUPABASE_URL } from "./config.js";

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

export interface QueryTableParams {
  ascending?: boolean;
  filters?: Record<string, unknown>;
  limit?: number;
  orderBy?: string;
  select?: string[];
  table: string;
}

export const queryTable = (
  supabase: SupabaseClient,
  params: QueryTableParams,
): Effect.Effect<unknown[], DbcQueryError> =>
  Effect.gen(function* () {
    const {
      ascending = true,
      filters,
      limit = 10,
      orderBy,
      select,
      table,
    } = params;

    let builder = supabase
      .schema("raw_dbc")
      .from(table)
      .select(select?.join(",") ?? "*");

    if (filters) {
      for (const [column, value] of Object.entries(filters)) {
        if (value === null || value === undefined) {
          continue;
        }

        if (typeof value === "object" && !Array.isArray(value)) {
          const filterObj = value as Record<string, unknown>;

          if ("eq" in filterObj) {
            builder = builder.eq(column, filterObj.eq);
          }

          if ("gte" in filterObj) {
            builder = builder.gte(column, filterObj.gte);
          }

          if ("gt" in filterObj) {
            builder = builder.gt(column, filterObj.gt);
          }

          if ("lte" in filterObj) {
            builder = builder.lte(column, filterObj.lte);
          }

          if ("lt" in filterObj) {
            builder = builder.lt(column, filterObj.lt);
          }

          if ("like" in filterObj) {
            builder = builder.like(column, filterObj.like as string);
          }

          if ("ilike" in filterObj) {
            builder = builder.ilike(column, filterObj.ilike as string);
          }
        } else {
          builder = builder.eq(column, value);
        }
      }
    }

    if (orderBy) {
      builder = builder.order(orderBy, { ascending });
    }

    builder = builder.limit(limit);

    const result = yield* Effect.tryPromise({
      catch: (cause) =>
        new DbcQueryError({
          cause,
          message: `Failed to query ${table}`,
        }),
      try: () => builder,
    });

    if (result.error) {
      return yield* Effect.fail(
        new DbcQueryError({
          message: `Query error on ${table}: ${result.error.message}`,
        }),
      );
    }

    return result.data ?? [];
  });

export const searchSpells = (
  supabase: SupabaseClient,
  searchQuery: string,
  limit: number = 10,
) =>
  Effect.gen(function* () {
    const result = yield* Effect.tryPromise({
      catch: (cause) =>
        new DbcQueryError({
          cause,
          message: `Failed to search spells`,
        }),
      try: () =>
        supabase
          .schema("raw_dbc")
          .from("spell_name")
          .select("ID, Name_lang")
          .ilike("Name_lang", `%${searchQuery}%`)
          .limit(limit),
    });

    if (result.error) {
      return yield* Effect.fail(
        new DbcQueryError({
          message: `Search error: ${result.error.message}`,
        }),
      );
    }

    return (result.data ?? []).map(
      (row: { ID: number; Name_lang: string }) => ({
        description: "",
        id: row.ID,
        name: row.Name_lang || "",
      }),
    );
  });

export const searchItems = (
  supabase: SupabaseClient,
  searchQuery: string,
  limit: number = 10,
) =>
  Effect.gen(function* () {
    const result = yield* Effect.tryPromise({
      catch: (cause) =>
        new DbcQueryError({
          cause,
          message: `Failed to search items`,
        }),
      try: () =>
        supabase
          .schema("raw_dbc")
          .from("item_sparse")
          .select("ID, Display_lang, Description_lang")
          .ilike("Display_lang", `%${searchQuery}%`)
          .limit(limit),
    });

    if (result.error) {
      return yield* Effect.fail(
        new DbcQueryError({
          message: `Search error: ${result.error.message}`,
        }),
      );
    }

    return (result.data ?? []).map(
      (row: {
        ID: number;
        Display_lang: string;
        Description_lang: string;
      }) => ({
        description: row.Description_lang || "",
        id: row.ID,
        name: row.Display_lang || "",
      }),
    );
  });

export const getTableSchema = (
  supabase: SupabaseClient,
  table: string,
): Effect.Effect<
  {
    table: string;
    columns: Array<{ name: string; type: string; nullable: boolean }>;
  },
  DbcQueryError
> =>
  Effect.gen(function* () {
    const sampleResult = yield* Effect.tryPromise({
      catch: (cause) =>
        new DbcQueryError({
          cause,
          message: `Failed to get sample for ${table}`,
        }),
      try: () => supabase.schema("raw_dbc").from(table).select("*").limit(1),
    });

    if (sampleResult.error || !sampleResult.data?.[0]) {
      return { columns: [], table };
    }

    const firstRow = sampleResult.data[0];
    const columns = Object.keys(firstRow).map((name) => ({
      name,
      nullable: true,
      type: typeof firstRow[name],
    }));

    return { columns, table };
  });

export const SupabaseDbcBatchFetcherLive = (
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

      return query<Array<{ ID: number } & DbcRow<Table>>>(
        supabase,
        table,
        (builder) => builder.select("*").in("ID", [...ids]),
      );
    },
  });

export class SupabaseClientService extends Effect.Service<SupabaseClientService>()(
  "@wowlab/mcp-server/SupabaseClient",
  {
    effect: Effect.gen(function* () {
      const url = yield* Config.string("SUPABASE_URL").pipe(
        Config.withDefault(DEFAULT_SUPABASE_URL),
      );
      const key = yield* Config.string("SUPABASE_ANON_KEY").pipe(
        Config.withDefault(DEFAULT_SUPABASE_ANON_KEY),
      );

      const client = createClient(url, key);

      return { client };
    }),
  },
) {}

export const SupabaseDbcServiceLayer = Layer.unwrapEffect(
  Effect.gen(function* () {
    const { client } = yield* SupabaseClientService;
    return DbcServiceLive.pipe(
      Layer.provide(SupabaseDbcBatchFetcherLive(client)),
    );
  }),
);

export { type Schemas, type SupabaseClient };
