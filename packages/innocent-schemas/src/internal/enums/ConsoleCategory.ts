import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum ConsoleCategory {
  Debug = 0,
  Graphics = 1,
  Console = 2,
  Combat = 3,
  Game = 4,
  Default = 5,
  Net = 6,
  Sound = 7,
  Gm = 8,
  Reveal = 9,
  None = 10,
}

export const ConsoleCategorySchema = Schema.Enums(ConsoleCategory);
