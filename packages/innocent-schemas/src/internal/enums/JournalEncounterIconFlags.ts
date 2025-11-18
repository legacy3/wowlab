import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum JournalEncounterIconFlags {
  Tank = 1,
  Dps = 2,
  Healer = 4,
  Heroic = 8,
  Deadly = 16,
  Important = 32,
  Interruptible = 64,
  Magic = 128,
  Curse = 256,
  Poison = 512,
  Disease = 1024,
  Enrage = 2048,
  Mythic = 4096,
  Bleed = 8192,
}

export const JournalEncounterIconFlagsSchema = Schema.Enums(
  JournalEncounterIconFlags,
);
