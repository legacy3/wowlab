import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum BattlepetDeletedReason {
  Unknown = 0,
  PlayerReleased = 1,
  PlayerCaged = 2,
  Gm = 3,
  CageError = 4,
  DelJournal = 5,
  TradingPost = 6,
  AccountStore = 7,
}

export const BattlepetDeletedReasonSchema = Schema.Enums(
  BattlepetDeletedReason,
);
