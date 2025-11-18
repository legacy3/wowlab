import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum UIMapType {
  Cosmic = 0,
  World = 1,
  Continent = 2,
  Zone = 3,
  Dungeon = 4,
  Micro = 5,
  Orphan = 6,
}

export const UIMapTypeSchema = Schema.Enums(UIMapType);
