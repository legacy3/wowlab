import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum RolodexType {
  None = 0,
  PartyMember = 1,
  RaidMember = 2,
  Trade = 3,
  Whisper = 4,
  PublicOrderFilledByOther = 5,
  PublicOrderFilledByYou = 6,
  PersonalOrderFilledByOther = 7,
  PersonalOrderFilledByYou = 8,
  GuildOrderFilledByOther = 9,
  GuildOrderFilledByYou = 10,
  CreatureKill = 11,
  CompleteDungeon = 12,
  KillRaidBoss = 13,
  KillLfrBoss = 14,
  CompleteDelve = 15,
  CompleteArena = 16,
  CompleteBg = 17,
  Duel = 18,
  PetBattle = 19,
  PvPKill = 20,
}

export const RolodexTypeSchema = Schema.Enums(RolodexType);
