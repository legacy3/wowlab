import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum ItemBind {
  None = 0,
  OnAcquire = 1,
  OnEquip = 2,
  OnUse = 3,
  Quest = 4,
  Unused1 = 5,
  Unused2 = 6,
  ToWoWAccount = 7,
  ToBnetAccount = 8,
  ToBnetAccountUntilEquipped = 9,
}

export const ItemBindSchema = Schema.Enums(ItemBind);
