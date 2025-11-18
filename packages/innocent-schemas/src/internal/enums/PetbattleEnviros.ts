import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

export enum PetbattleEnviros {
  Pad0 = 0,
  Pad1 = 1,
  Weather = 2,
}

export const PetbattleEnvirosSchema = Schema.Enums(PetbattleEnviros);
