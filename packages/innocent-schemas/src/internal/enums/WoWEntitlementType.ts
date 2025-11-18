import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum WoWEntitlementType {
  Item = 0,
  Mount = 1,
  Battlepet = 2,
  Toy = 3,
  Appearance = 4,
  AppearanceSet = 5,
  GameTime = 6,
  Title = 7,
  Illusion = 8,
  Invalid = 9,
}

export const WoWEntitlementTypeSchema = Schema.Enums(WoWEntitlementType);
