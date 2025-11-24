import type { SupabaseClient } from "@supabase/supabase-js";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Context from "effect/Context";

// Minimal local types to keep portal compiling without legacy packages.
export type SpellDataFlat = { id: number; name: string } & Record<string, any>;
export type ItemDataFlat = { id: number; name: string } & Record<string, any>;

export class SpellInfoNotFound extends Error {
  constructor(
    readonly spellId: number,
    message?: string,
  ) {
    super(message ?? `Spell ${spellId} not found`);
  }
}

export class ItemNotFound extends Error {
  constructor(
    readonly itemId: number,
    message?: string,
  ) {
    super(message ?? `Item ${itemId} not found`);
  }
}

export class DataError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export interface MetadataService {
  readonly loadSpell: (
    spellId: number,
  ) => Effect.Effect<SpellDataFlat, SpellInfoNotFound | DataError>;
  readonly loadItem: (
    itemId: number,
  ) => Effect.Effect<ItemDataFlat, ItemNotFound | DataError>;
}

export const MetadataService = Context.GenericTag<MetadataService>(
  "portal/MetadataService",
);

export const createSupabaseMetadataService = (
  supabase: SupabaseClient,
): Layer.Layer<MetadataService> =>
  Layer.succeed(MetadataService, {
    loadSpell: (spellId: number) =>
      Effect.gen(function* () {
        // Just fetch from Supabase
        const { data, error } = yield* Effect.promise(() =>
          supabase.from("spell_data").select("*").eq("id", spellId).single(),
        );

        // Handle errors
        if (error) {
          if (error.code === "PGRST116") {
            return yield* Effect.fail(
              new SpellInfoNotFound(
                spellId,
                `Spell ${spellId} not found in database`,
              ),
            );
          }
          return yield* Effect.fail(
            new DataError(`Failed to fetch spell ${spellId}: ${error.message}`),
          );
        }

        if (!data) {
          return yield* Effect.fail(
            new SpellInfoNotFound(
              spellId,
              `Spell ${spellId} not found in database`,
            ),
          );
        }

        // Return as-is (already flat from DB)
        return data as SpellDataFlat;
      }),

    loadItem: (itemId: number) =>
      Effect.gen(function* () {
        // Just fetch from Supabase
        const { data, error } = yield* Effect.promise(() =>
          supabase.from("item_data").select("*").eq("id", itemId).single(),
        );

        // Handle errors
        if (error) {
          if (error.code === "PGRST116") {
            return yield* Effect.fail(
              new ItemNotFound(itemId, `Item ${itemId} not found in database`),
            );
          }
          return yield* Effect.fail(
            new DataError(`Failed to fetch item ${itemId}: ${error.message}`),
          );
        }

        if (!data) {
          return yield* Effect.fail(
            new ItemNotFound(itemId, `Item ${itemId} not found in database`),
          );
        }

        // Return as-is
        return data as ItemDataFlat;
      }),
  });
