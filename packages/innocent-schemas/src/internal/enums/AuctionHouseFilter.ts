import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum AuctionHouseFilter {
  None = 0,
  UncollectedOnly = 1,
  UsableOnly = 2,
  CurrentExpansionOnly = 3,
  UpgradesOnly = 4,
  ExactMatch = 5,
  PoorQuality = 6,
  CommonQuality = 7,
  UncommonQuality = 8,
  RareQuality = 9,
  EpicQuality = 10,
  LegendaryQuality = 11,
  ArtifactQuality = 12,
  LegendaryCraftedItemOnly = 13,
}

export const AuctionHouseFilterSchema = Schema.Enums(AuctionHouseFilter);
