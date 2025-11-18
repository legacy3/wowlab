import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum BattlePetSources {
  Drop = 0,
  Quest = 1,
  Vendor = 2,
  Profession = 3,
  WildPet = 4,
  Achievement = 5,
  WorldEvent = 6,
  Promotion = 7,
  Tcg = 8,
  PetStore = 9,
  Discovery = 10,
  TradingPost = 11,
}

export const BattlePetSourcesSchema = Schema.Enums(BattlePetSources);
