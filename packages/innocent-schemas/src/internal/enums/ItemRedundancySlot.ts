import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum ItemRedundancySlot {
  Head = 0,
  Neck = 1,
  Shoulder = 2,
  Chest = 3,
  Waist = 4,
  Legs = 5,
  Feet = 6,
  Wrist = 7,
  Hand = 8,
  Finger = 9,
  Trinket = 10,
  Cloak = 11,
  Twohand = 12,
  MainhandWeapon = 13,
  OnehandWeapon = 14,
  OnehandWeaponSecond = 15,
  Offhand = 16,
}

export const ItemRedundancySlotSchema = Schema.Enums(ItemRedundancySlot);
