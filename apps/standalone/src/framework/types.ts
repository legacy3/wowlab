import * as Errors from "@wowlab/core/Errors";
import * as Schemas from "@wowlab/core/Schemas";
import * as Context from "@wowlab/rotation/Context";
import * as Effect from "effect/Effect";

import { createPlayerWithSpells } from "./rotation-utils.js";

/**
 * Definition for a rotation that can be run by the standalone simulation.
 */
export interface RotationDefinition {
  /** Display name for the rotation */
  readonly name: string;

  /** The APL logic that decides what to cast each GCD */
  readonly run: (
    playerId: Schemas.Branded.UnitID,
    targetId: Schemas.Branded.UnitID,
  ) => Effect.Effect<void, Errors.RotationError, Context.RotationContext>;

  /** All spell IDs needed by this rotation (used to load spell data) */
  readonly spellIds: readonly number[];
}

/**
 * Creates a player unit for a rotation definition.
 * This is the default implementation - rotations can override if needed.
 */
export const createRotationPlayer = (
  rotation: RotationDefinition,
  id: Schemas.Branded.UnitID,
  spells: Schemas.Spell.SpellDataFlat[],
) => createPlayerWithSpells(id, rotation.name, rotation.spellIds, spells);
