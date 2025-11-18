import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum ModelSceneType {
  MountJournal = 0,
  PetJournalCard = 1,
  ShopCard = 2,
  EncounterJournal = 3,
  PetJournalLoadout = 4,
  ArtifactTier2 = 5,
  ArtifactTier2ForgingScene = 6,
  ArtifactTier2SlamEffect = 7,
  CommentatorVictoryFanfare = 8,
  ArtifactRelicTalentEffect = 9,
  PvPWarModeOrb = 10,
  PvPWarModeFire = 11,
  PartyPose = 12,
  AzeriteItemLevelUpToast = 13,
  AzeritePowers = 14,
  AzeriteRewardGlow = 15,
  HeartOfAzeroth = 16,
  WorldMapThreat = 17,
  Soulbinds = 18,
  JailersTowerAnimaGlow = 19,
}

export const ModelSceneTypeSchema = Schema.Enums(ModelSceneType);
