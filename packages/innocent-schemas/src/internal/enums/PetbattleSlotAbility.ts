import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

export enum PetbattleSlotAbility {
  Ability_0 = 0,
  Ability_1 = 1,
  Ability_2 = 2,
}

export const PetbattleSlotAbilitySchema = Schema.Enums(PetbattleSlotAbility);
