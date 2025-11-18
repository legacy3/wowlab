import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum PerksVendorCategoryType {
  Transmog = 1,
  Mount = 2,
  Pet = 3,
  Toy = 5,
  Illusion = 7,
  Transmogset = 8,
  WarbandScene = 9,
  Stipend = 20,
  Activity = 21,
  GmAdjustment = 22,
  Achievement = 23,
  UnusedPerksVendorCategoryRefundUnused = 24,
}

export const PerksVendorCategoryTypeSchema = Schema.Enums(
  PerksVendorCategoryType,
);
