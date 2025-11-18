import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum JailersTowerType {
  TwistingCorridors = 0,
  SkoldusHalls = 1,
  FractureChambers = 2,
  Soulforges = 3,
  Coldheart = 4,
  Mortregar = 5,
  UpperReaches = 6,
  ArkobanHall = 7,
  TormentChamberJaina = 8,
  TormentChamberThrall = 9,
  TormentChamberAnduin = 10,
  AdamantVaults = 11,
  ForgottenCatacombs = 12,
  Ossuary = 13,
  BossRush = 14,
}

export const JailersTowerTypeSchema = Schema.Enums(JailersTowerType);
