import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum PetbattlePboid {
  P0Pet_0 = 0,
  P0Pet_1 = 1,
  P0Pet_2 = 2,
  P1Pet_0 = 3,
  P1Pet_1 = 4,
  P1Pet_2 = 5,
  EnvPad_0 = 6,
  EnvPad_1 = 7,
  EnvWeather = 8,
}

export const PetbattlePboidSchema = Schema.Enums(PetbattlePboid);
