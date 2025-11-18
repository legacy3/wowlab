import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum PetbattleResult {
  FailUnknown = 0,
  FailNotHere = 1,
  FailNotHereOnTransport = 2,
  FailNotHereUnevenGround = 3,
  FailNotHereObstructed = 4,
  FailNotWhileInCombat = 5,
  FailNotWhileDead = 6,
  FailNotWhileFlying = 7,
  FailTargetInvalid = 8,
  FailTargetOutOfRange = 9,
  FailTargetNotCapturable = 10,
  FailNotATrainer = 11,
  FailDeclined = 12,
  FailInBattle = 13,
  FailInvalidLoadout = 14,
  FailInvalidLoadoutAllDead = 15,
  FailInvalidLoadoutNoneSlotted = 16,
  FailNoJournalLock = 17,
  FailWildPetTapped = 18,
  FailRestrictedAccount = 19,
  FailOpponentNotAvailable = 20,
  FailLogout = 21,
  FailDisconnect = 22,
  Success = 23,
}

export const PetbattleResultSchema = Schema.Enums(PetbattleResult);
