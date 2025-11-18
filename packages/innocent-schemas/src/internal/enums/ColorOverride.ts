import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum ColorOverride {
  ItemQualityPoor = 0,
  ItemQualityCommon = 1,
  ItemQualityUncommon = 2,
  ItemQualityRare = 3,
  ItemQualityEpic = 4,
  ItemQualityLegendary = 5,
  ItemQualityArtifact = 6,
  ItemQualityAccount = 7,
}

export const ColorOverrideSchema = Schema.Enums(ColorOverride);
