import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum UIWidgetTextSizeType {
  Small12Pt = 0,
  Medium16Pt = 1,
  Large24Pt = 2,
  Huge27Pt = 3,
  Standard14Pt = 4,
  Small10Pt = 5,
  Small11Pt = 6,
  Medium18Pt = 7,
  Large20Pt = 8,
}

export const UIWidgetTextSizeTypeSchema = Schema.Enums(UIWidgetTextSizeType);
