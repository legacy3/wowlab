import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum WidgetOpacityType {
  OneHundred = 0,
  Ninety = 1,
  Eighty = 2,
  Seventy = 3,
  Sixty = 4,
  Fifty = 5,
  Forty = 6,
  Thirty = 7,
  Twenty = 8,
  Ten = 9,
  Zero = 10,
}

export const WidgetOpacityTypeSchema = Schema.Enums(WidgetOpacityType);
