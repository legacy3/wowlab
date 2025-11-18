import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum ConsoleColorType {
  DefaultColor = 0,
  InputColor = 1,
  EchoColor = 2,
  ErrorColor = 3,
  WarningColor = 4,
  GlobalColor = 5,
  AdminColor = 6,
  HighlightColor = 7,
  BackgroundColor = 8,
  ClickbufferColor = 9,
  PrivateColor = 10,
  DefaultGreen = 11,
}

export const ConsoleColorTypeSchema = Schema.Enums(ConsoleColorType);
