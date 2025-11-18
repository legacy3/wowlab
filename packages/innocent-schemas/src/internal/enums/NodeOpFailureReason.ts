import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum NodeOpFailureReason {
  None = 0,
  MissingEdgeConnection = 1,
  RequiredForEdge = 2,
  MissingRequiredEdge = 3,
  HasMutuallyExclusiveEdge = 4,
  NotEnoughSourcedCurrencySpent = 5,
  NotEnoughCurrencySpent = 6,
  NotEnoughGoldSpent = 7,
  MissingAchievement = 8,
  MissingQuest = 9,
  WrongSpec = 10,
  WrongSelection = 11,
  MaxRank = 12,
  DataError = 13,
  NotEnoughSourcedCurrency = 14,
  NotEnoughCurrency = 15,
  NotEnoughGold = 16,
  SameSelection = 17,
  NodeNotFound = 18,
  EntryNotFound = 19,
  RequiredForCondition = 20,
  WrongTreeID = 21,
  LevelTooLow = 22,
  TreeFlaggedNoRefund = 23,
  NodeNeverPurchasable = 24,
  AccountDataNoMatch = 25,
}

export const NodeOpFailureReasonSchema = Schema.Enums(NodeOpFailureReason);
