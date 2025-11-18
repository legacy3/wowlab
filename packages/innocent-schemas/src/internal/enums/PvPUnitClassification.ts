import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum PvPUnitClassification {
  FlagCarrierHorde = 0,
  FlagCarrierAlliance = 1,
  FlagCarrierNeutral = 2,
  CartRunnerHorde = 3,
  CartRunnerAlliance = 4,
  AssassinHorde = 5,
  AssassinAlliance = 6,
  OrbCarrierBlue = 7,
  OrbCarrierGreen = 8,
  OrbCarrierOrange = 9,
  OrbCarrierPurple = 10,
}

export const PvPUnitClassificationSchema = Schema.Enums(PvPUnitClassification);
