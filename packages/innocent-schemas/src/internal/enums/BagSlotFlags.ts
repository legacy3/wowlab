import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum BagSlotFlags {
  DisableAutoSort = 1,
  ClassEquipment = 2,
  ClassConsumables = 4,
  ClassProfessionGoods = 8,
  ClassJunk = 16,
  ClassQuestItems = 32,
  ExcludeJunkSell = 64,
  ClassReagents = 128,
  ExpansionCurrent = 256,
  ExpansionLegacy = 512,
}

export const BagSlotFlagsSchema = Schema.Enums(BagSlotFlags);
