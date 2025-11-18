import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum CurrencyGainFlags {
  None = 0,
  BonusAward = 1,
  DroppedFromDeath = 2,
  FromAccountServer = 4,
  Autotracking = 8,
}

export const CurrencyGainFlagsSchema = Schema.Enums(CurrencyGainFlags);
