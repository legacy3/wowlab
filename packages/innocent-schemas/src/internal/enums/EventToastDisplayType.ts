import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum EventToastDisplayType {
  NormalSingleLine = 0,
  NormalBlockText = 1,
  NormalTitleAndSubTitle = 2,
  NormalTextWithIcon = 3,
  LargeTextWithIcon = 4,
  NormalTextWithIconAndRarity = 5,
  Scenario = 6,
  ChallengeMode = 7,
  ScenarioClickExpand = 8,
  WeeklyRewardUnlock = 9,
  WeeklyRewardUpgrade = 10,
  FlightpointDiscovered = 11,
  CapstoneUnlocked = 12,
  SingleLineWithIcon = 13,
  Scoreboard = 14,
}

export const EventToastDisplayTypeSchema = Schema.Enums(EventToastDisplayType);
