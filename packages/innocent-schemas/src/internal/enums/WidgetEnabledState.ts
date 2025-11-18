import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum WidgetEnabledState {
  Disabled = 0,
  Yellow = 1,
  Red = 2,
  White = 3,
  Green = 4,
  Artifact = 5,
  Black = 6,
  BrightBlue = 7,
}

export const WidgetEnabledStateSchema = Schema.Enums(WidgetEnabledState);
