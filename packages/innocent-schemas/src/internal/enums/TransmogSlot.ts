import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum TransmogSlot {
  Head = 0,
  Shoulder = 1,
  Back = 2,
  Chest = 3,
  Body = 4,
  Tabard = 5,
  Wrist = 6,
  Hand = 7,
  Waist = 8,
  Legs = 9,
  Feet = 10,
  Mainhand = 11,
  Offhand = 12,
}

export const TransmogSlotSchema = Schema.Enums(TransmogSlot);
