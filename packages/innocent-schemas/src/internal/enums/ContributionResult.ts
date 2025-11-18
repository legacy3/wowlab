import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum ContributionResult {
  Success = 0,
  MustBeNearNpc = 1,
  IncorrectState = 2,
  InvalidID = 3,
  QuestDataMissing = 4,
  FailedConditionCheck = 5,
  UnableToCompleteTurnIn = 6,
  InternalError = 7,
}

export const ContributionResultSchema = Schema.Enums(ContributionResult);
