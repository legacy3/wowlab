import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum GarrisonFollowerType {
  FollowerType_6_0_GarrisonFollower = 1,
  FollowerType_6_0_Boat = 2,
  FollowerType_7_0_GarrisonFollower = 4,
  FollowerType_8_0_GarrisonFollower = 22,
  FollowerType_9_0_GarrisonFollower = 123,
}

export const GarrisonFollowerTypeSchema = Schema.Enums(GarrisonFollowerType);
