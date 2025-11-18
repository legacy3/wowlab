import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum BattlePetSpeciesFlags {
  NoRename = 1,
  WellKnown = 2,
  NotAcccountwide = 4,
  Capturable = 8,
  NotTradable = 16,
  HideFromJournal = 32,
  LegacyAccountUnique = 64,
  CantBattle = 128,
  HordeOnly = 256,
  AllianceOnly = 512,
  Boss = 1024,
  RandomDisplay = 2048,
  NoLicenseRequired = 4096,
  AddsAllowedWithBoss = 8192,
  HideUntilLearned = 16384,
  MatchPlayerHighPetLevel = 32768,
  NoWildPetAddsAllowed = 65536,
}

export const BattlePetSpeciesFlagsSchema = Schema.Enums(BattlePetSpeciesFlags);
