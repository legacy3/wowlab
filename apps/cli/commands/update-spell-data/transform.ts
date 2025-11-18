import * as Spell from "@packages/innocent-schemas/Spell";
import * as Data from "@packages/innocent-services/Data";
import * as Effect from "effect/Effect";

export const parseSpellIds = (
  input: string,
  cache: ReturnType<typeof Data.createCache>,
): number[] =>
  input === "all"
    ? Array.from(cache.spellMisc.keys())
    : input.split(",").map((id) => parseInt(id.trim(), 10));

export const transformSpells = (
  spellIds: number[],
  cache: ReturnType<typeof Data.createCache>,
) =>
  Effect.gen(function* () {
    const results = yield* Effect.forEach(
      spellIds,
      (spellId) =>
        Effect.gen(function* () {
          const result = yield* Effect.either(
            Data.transformSpell(spellId, cache),
          );

          if (result._tag === "Right") {
            // Transform nested DBC to flat camelCase structure
            return Data.flattenSpellData(
              result.right as Spell.SpellDataFlatSchema,
            );
          } else {
            yield* Effect.logDebug(`⚠️  Spell ${spellId} not found, skipping`);
            return null;
          }
        }),
      { concurrency: "unbounded" },
    );

    return results.filter(
      (spell): spell is Spell.SpellDataFlat => spell !== null,
    );
  });
