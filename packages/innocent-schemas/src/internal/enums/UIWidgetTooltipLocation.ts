import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum UIWidgetTooltipLocation {
  Default = 0,
  BottomLeft = 1,
  Left = 2,
  TopLeft = 3,
  Top = 4,
  TopRight = 5,
  Right = 6,
  BottomRight = 7,
  Bottom = 8,
}

export const UIWidgetTooltipLocationSchema = Schema.Enums(
  UIWidgetTooltipLocation,
);
