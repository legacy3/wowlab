import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum ItemSlotFilterType {
  Head = 0,
  Neck = 1,
  Shoulder = 2,
  Cloak = 3,
  Chest = 4,
  Wrist = 5,
  Hand = 6,
  Waist = 7,
  Legs = 8,
  Feet = 9,
  MainHand = 10,
  OffHand = 11,
  Finger = 12,
  Trinket = 13,
  Other = 14,
  NoFilter = 15,
}

export const ItemSlotFilterTypeSchema = Schema.Enums(ItemSlotFilterType);
