import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum QuestTag {
  Group = 1,
  PvP = 41,
  Raid = 62,
  Dungeon = 81,
  Legendary = 83,
  Heroic = 85,
  Raid10 = 88,
  Raid25 = 89,
  Scenario = 98,
  Account = 102,
  CombatAlly = 266,
  Delve = 288,
}

export const QuestTagSchema = Schema.Enums(QuestTag);
