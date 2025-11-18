import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum SpellDisplayBorderColor {
  None = 0,
  Black = 1,
  White = 2,
  Red = 3,
  Yellow = 4,
  Orange = 5,
  Purple = 6,
  Green = 7,
  Blue = 8,
}

export const SpellDisplayBorderColorSchema = Schema.Enums(
  SpellDisplayBorderColor,
);
