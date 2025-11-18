import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum BattlePetAbilityTargets {
  EnemyFrontPet = 0,
  FriendlyFrontPet = 1,
  Weather = 2,
  EnemyPad = 3,
  FriendlyPad = 4,
  EnemyBackPet_1 = 5,
  EnemyBackPet_2 = 6,
  FriendlyBackPet_1 = 7,
  FriendlyBackPet_2 = 8,
  Caster = 9,
  Owner = 10,
  Specific = 11,
  ProcTarget = 12,
}

export const BattlePetAbilityTargetsSchema = Schema.Enums(
  BattlePetAbilityTargets,
);
