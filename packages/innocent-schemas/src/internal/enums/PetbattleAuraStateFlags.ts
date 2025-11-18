import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum PetbattleAuraStateFlags {
  None = 0,
  Infinite = 1,
  Canceled = 2,
  InitDisabled = 4,
  CountdownFirstRound = 8,
  JustApplied = 16,
  RemoveEventHandled = 32,
}

export const PetbattleAuraStateFlagsSchema = Schema.Enums(
  PetbattleAuraStateFlags,
);
