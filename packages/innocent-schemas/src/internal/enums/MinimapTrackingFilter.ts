import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum MinimapTrackingFilter {
  Unfiltered = 0,
  Auctioneer = 1,
  Banker = 2,
  Battlemaster = 4,
  TaxiNode = 8,
  VenderFood = 16,
  Innkeeper = 32,
  Mailbox = 64,
  TrainerProfession = 128,
  VendorReagent = 256,
  Repair = 512,
  TrivialQuests = 1024,
  Stablemaster = 2048,
  Transmogrifier = 4096,
  POI = 8192,
  Target = 16384,
  Focus = 32768,
  QuestPOIs = 65536,
  Digsites = 131072,
  Barber = 262144,
  ItemUpgrade = 524288,
  VendorPoison = 1048576,
  AccountCompletedQuests = 2097152,
  AccountBanker = 4194304,
}

export const MinimapTrackingFilterSchema = Schema.Enums(MinimapTrackingFilter);
