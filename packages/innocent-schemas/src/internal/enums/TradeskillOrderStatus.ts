import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum TradeskillOrderStatus {
  Unclaimed = 1,
  Started = 2,
  Completed = 3,
  Expired = 4,
}

export const TradeskillOrderStatusSchema = Schema.Enums(TradeskillOrderStatus);
