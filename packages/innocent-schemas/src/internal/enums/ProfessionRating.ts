import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum ProfessionRating {
  Inspiration = 0,
  Resourcefulness = 1,
  Finesse = 2,
  Deftness = 3,
  Perception = 4,
  CraftingSpeed = 5,
  Multicraft = 6,
  Ingenuity = 7,
  Unused_2 = 8,
}

export const ProfessionRatingSchema = Schema.Enums(ProfessionRating);
