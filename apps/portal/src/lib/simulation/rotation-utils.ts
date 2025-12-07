import * as Entities from "@wowlab/core/Entities";
import * as Errors from "@wowlab/core/Errors";
import * as Schemas from "@wowlab/core/Schemas";
import * as Context from "@wowlab/rotation/Context";
import * as Effect from "effect/Effect";
import { Map, Record } from "immutable";

/**
 * Creates a spell entity from flat spell data.
 */
export const createSpellEntity = (
  data: Schemas.Spell.SpellDataFlat,
): Entities.Spell.Spell => {
  const info = Entities.Spell.SpellInfo.create({
    ...data,
    id: Schemas.Branded.SpellID(data.id),
    modifiers: [],
  });

  return Entities.Spell.Spell.create(
    {
      charges: info.maxCharges || 1,
      cooldownExpiry: 0,
      info,
    },
    0,
  );
};

/**
 * Creates a player unit with spells derived from the provided spell IDs.
 * Automatically filters out any spell IDs that aren't found in the spell data.
 */
export const createPlayerWithSpells = (
  id: Schemas.Branded.UnitID,
  name: string,
  spellIds: readonly number[],
  spellData: Schemas.Spell.SpellDataFlat[],
): Entities.Unit.Unit => {
  // Build lookup by raw number for easier matching
  const spellMap = new globalThis.Map<number, Schemas.Spell.SpellDataFlat>();
  for (const spell of spellData) {
    spellMap.set(spell.id, spell);
  }

  const spellEntities: [Schemas.Branded.SpellID, Entities.Spell.Spell][] = [];

  for (const spellId of spellIds) {
    const data = spellMap.get(spellId);
    if (!data) {
      console.warn(`Spell ID ${spellId} not found in spell data`);
      continue;
    }

    const entity = createSpellEntity(data);
    spellEntities.push([entity.info.id, entity]);
  }

  return Entities.Unit.Unit.create({
    id,
    isPlayer: true,
    name,
    spells: {
      all: Map(spellEntities),
      meta: Record({ cooldownCategories: Map<number, number>() })(),
    },
  });
};

/**
 * Result of attempting to cast a spell.
 */
export type CastResult =
  | { readonly cast: true; readonly consumedGCD: boolean }
  | { readonly cast: false };

/**
 * Attempts to cast a spell, returning whether it was cast and consumed the GCD.
 * Silently handles SpellOnCooldown errors by returning { cast: false }.
 */
export const tryCast = (
  rotation: Context.RotationContext,
  playerId: Schemas.Branded.UnitID,
  spellId: number,
): Effect.Effect<CastResult, Errors.SpellNotFound | Errors.UnitNotFound> =>
  rotation.spell.cast(playerId, spellId).pipe(
    Effect.map(({ consumedGCD }) => ({ cast: true as const, consumedGCD })),
    Effect.catchTag("SpellOnCooldown", () =>
      Effect.succeed({ cast: false as const }),
    ),
  );

/**
 * Runs a priority list of spells, stopping after the first one consumes the GCD.
 * Each spell is tried in order. Off-GCD spells that succeed won't stop the list.
 */
export const runPriorityList = (
  rotation: Context.RotationContext,
  playerId: Schemas.Branded.UnitID,
  spellIds: readonly number[],
): Effect.Effect<void, Errors.SpellNotFound | Errors.UnitNotFound> =>
  Effect.gen(function* () {
    for (const spellId of spellIds) {
      const result = yield* tryCast(rotation, playerId, spellId);
      if (result.cast && result.consumedGCD) {
        return;
      }
    }
  });
