import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum TransmogSource {
  None = 0,
  JournalEncounter = 1,
  Quest = 2,
  Vendor = 3,
  WorldDrop = 4,
  HiddenUntilCollected = 5,
  CantCollect = 6,
  Achievement = 7,
  Profession = 8,
  NotValidForTransmog = 9,
  TradingPost = 10,
}

export const TransmogSourceSchema = Schema.Enums(TransmogSource);
