import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum ScreenLocationType {
  Center = 0,
  Left = 1,
  Right = 2,
  Top = 3,
  Bottom = 4,
  TopLeft = 5,
  TopRight = 6,
  LeftOutside = 7,
  RightOutside = 8,
  LeftRight = 9,
  TopBottom = 10,
  LeftRightOutside = 11,
}

export const ScreenLocationTypeSchema = Schema.Enums(ScreenLocationType);
