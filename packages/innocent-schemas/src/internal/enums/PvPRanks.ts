import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum PvPRanks {
  RankNone = 0,
  RankPariah = 1,
  RankOutlaw = 2,
  RankExiled = 3,
  RankDishonored = 4,
  Rank_1 = 5,
  Rank_2 = 6,
  Rank_3 = 7,
  Rank_4 = 8,
  Rank_5 = 9,
  Rank_6 = 10,
  Rank_7 = 11,
  Rank_8 = 12,
  Rank_9 = 13,
  Rank_10 = 14,
  Rank_11 = 15,
  Rank_12 = 16,
  Rank_13 = 17,
  Rank_14 = 18,
}

export const PvPRanksSchema = Schema.Enums(PvPRanks);
