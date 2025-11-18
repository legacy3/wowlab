import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum CraftingOrderState {
  None = 0,
  Creating = 1,
  Created = 2,
  Claiming = 3,
  Claimed = 4,
  Rejecting = 5,
  Rejected = 6,
  Releasing = 7,
  Crafting = 8,
  Recrafting = 9,
  Fulfilling = 10,
  Fulfilled = 11,
  Canceling = 12,
  Canceled = 13,
  Expiring = 14,
  Expired = 15,
}

export const CraftingOrderStateSchema = Schema.Enums(CraftingOrderState);
