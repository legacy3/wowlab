import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum PetbattleSlotResult {
  Success = 0,
  SlotLocked = 1,
  SlotEmpty = 2,
  NoTracker = 3,
  NoSpeciesRec = 4,
  CantBattle = 5,
  Revoked = 6,
  Dead = 7,
  NoPet = 8,
}

export const PetbattleSlotResultSchema = Schema.Enums(PetbattleSlotResult);
