import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum QuestCompleteSpellType {
  LegacyBehavior = 0,
  Follower = 1,
  Tradeskill = 2,
  Ability = 3,
  Aura = 4,
  Spell = 5,
  Unlock = 6,
  Companion = 7,
  QuestlineUnlock = 8,
  QuestlineReward = 9,
  QuestlineUnlockPart = 10,
  PossibleReward = 11,
}

export const QuestCompleteSpellTypeSchema = Schema.Enums(
  QuestCompleteSpellType,
);
