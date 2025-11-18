import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum PetActionbuttonType {
  None = 0,
  Spell = 1,
  Slot1Obsolete = 2,
  Slot2Obsolete = 3,
  Slot3Obsolete = 4,
  Slot4Obsolete = 5,
  Mode = 6,
  Orders = 7,
  Slot1 = 8,
  Slot2 = 9,
  Slot3 = 10,
  Slot4 = 11,
  Slot5 = 12,
  Slot6 = 13,
  Slot7 = 14,
  Slot8 = 15,
  Slot9 = 16,
  Slot10 = 17,
  Max = 18,
  VehicleAction = 19,
}

export const PetActionbuttonTypeSchema = Schema.Enums(PetActionbuttonType);
