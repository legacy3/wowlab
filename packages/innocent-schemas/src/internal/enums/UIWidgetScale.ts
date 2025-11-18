import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum UIWidgetScale {
  OneHundred = 0,
  Ninty = 1,
  Eighty = 2,
  Seventy = 3,
  Sixty = 4,
  Fifty = 5,
  OneHundredTen = 6,
  OneHundredTwenty = 7,
  OneHundredThirty = 8,
  OneHundredForty = 9,
  OneHundredFifty = 10,
  OneHundredSixty = 11,
  OneHundredSeventy = 12,
  OneHundredEighty = 13,
  OneHundredNinety = 14,
  TwoHundred = 15,
}

export const UIWidgetScaleSchema = Schema.Enums(UIWidgetScale);
