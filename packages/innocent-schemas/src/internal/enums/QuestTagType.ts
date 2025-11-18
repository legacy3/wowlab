import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum QuestTagType {
  Tag = 0,
  Profession = 1,
  Normal = 2,
  PvP = 3,
  PetBattle = 4,
  Bounty = 5,
  Dungeon = 6,
  Invasion = 7,
  Raid = 8,
  Contribution = 9,
  RatedReward = 10,
  InvasionWrapper = 11,
  FactionAssault = 12,
  Islands = 13,
  Threat = 14,
  CovenantCalling = 15,
  DragonRiderRacing = 16,
  Capstone = 17,
  WorldBoss = 18,
  Placeholder_1 = 19,
}

export const QuestTagTypeSchema = Schema.Enums(QuestTagType);
