import type { SupabaseClient } from "@supabase/supabase-js";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Spell from "@packages/innocent-schemas/Spell";
import * as Item from "@packages/innocent-schemas/Item";
import * as Errors from "@packages/innocent-domain/Errors";
import { MetadataService } from "@packages/innocent-services/Metadata";

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
              new Errors.SpellInfoNotFound({
                spellId,
                message: `Spell ${spellId} not found in database`,
              }),
            );
          }
          return yield* Effect.fail(
            new Errors.Data({
              message: `Failed to fetch spell ${spellId}: ${error.message}`,
            }),
          );
        }

        if (!data) {
          return yield* Effect.fail(
            new Errors.SpellInfoNotFound({
              spellId,
              message: `Spell ${spellId} not found in database`,
            }),
          );
        }

        // Return as-is (already flat from DB)
        return data as Spell.SpellDataFlat;
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
              new Errors.ItemNotFound({
                itemId,
                message: `Item ${itemId} not found in database`,
              }),
            );
          }
          return yield* Effect.fail(
            new Errors.Data({
              message: `Failed to fetch item ${itemId}: ${error.message}`,
            }),
          );
        }

        if (!data) {
          return yield* Effect.fail(
            new Errors.ItemNotFound({
              itemId,
              message: `Item ${itemId} not found in database`,
            }),
          );
        }

        // Return as-is
        return data as Item.ItemDataFlat;
      }),
  });
