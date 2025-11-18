import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum AuctionHouseTimeLeftBand {
  Short = 0,
  Medium = 1,
  Long = 2,
  VeryLong = 3,
}

export const AuctionHouseTimeLeftBandSchema = Schema.Enums(
  AuctionHouseTimeLeftBand,
);
