import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum TooltipDataItemBinding {
  Quest = 0,
  Account = 1,
  BnetAccount = 2,
  Soulbound = 3,
  BindToAccount = 4,
  BindToBnetAccount = 5,
  BindOnPickup = 6,
  BindOnEquip = 7,
  BindOnUse = 8,
  AccountUntilEquipped = 9,
  BindToAccountUntilEquipped = 10,
}

export const TooltipDataItemBindingSchema = Schema.Enums(
  TooltipDataItemBinding,
);
