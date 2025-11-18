import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum ExcludedCensorSources {
  None = 0,
  Friends = 1,
  Guild = 2,
  Reserve1 = 4,
  Reserve2 = 8,
  Reserve3 = 16,
  Reserve4 = 32,
  Reserve5 = 64,
  Reserve6 = 128,
  All = 255,
}

export const ExcludedCensorSourcesSchema = Schema.Enums(ExcludedCensorSources);
