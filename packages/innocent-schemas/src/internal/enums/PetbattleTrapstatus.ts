import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum PetbattleTrapstatus {
  Invalid = 0,
  CanTrap = 1,
  CantTrapNewbie = 2,
  CantTrapPetDead = 3,
  CantTrapPetHealth = 4,
  CantTrapNoRoomInJournal = 5,
  CantTrapPetNotCapturable = 6,
  CantTrapTrainerBattle = 7,
  CantTrapTwice = 8,
}

export const PetbattleTrapstatusSchema = Schema.Enums(PetbattleTrapstatus);
