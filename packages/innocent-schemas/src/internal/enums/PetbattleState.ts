import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum PetbattleState {
  Created = 0,
  WaitingPreBattle = 1,
  RoundInProgress = 2,
  WaitingForFrontPets = 3,
  CreatedFailed = 4,
  FinalRound = 5,
  Finished = 6,
}

export const PetbattleStateSchema = Schema.Enums(PetbattleState);
