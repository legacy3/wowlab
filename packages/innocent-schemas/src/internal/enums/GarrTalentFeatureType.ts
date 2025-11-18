import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum GarrTalentFeatureType {
  Generic = 0,
  AnimaDiversion = 1,
  TravelPortals = 2,
  Adventures = 3,
  ReservoirUpgrades = 4,
  SanctumUnique = 5,
  SoulBinds = 6,
  AnimaDiversionMap = 7,
  Cyphers = 8,
}

export const GarrTalentFeatureTypeSchema = Schema.Enums(GarrTalentFeatureType);
