import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum QuestClassification {
  Important = 0,
  Legendary = 1,
  Campaign = 2,
  Calling = 3,
  Meta = 4,
  Recurring = 5,
  Questline = 6,
  Normal = 7,
  BonusObjective = 8,
  Threat = 9,
  WorldQuest = 10,
}

export const QuestClassificationSchema = Schema.Enums(QuestClassification);
