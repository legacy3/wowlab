import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

export enum GarrisonType {
  Type_6_0_Garrison = 2,
  Type_7_0_Garrison = 3,
  Type_8_0_Garrison = 9,
  Type_9_0_Garrison = 111,
}

export const GarrisonTypeSchema = Schema.Enums(GarrisonType);
