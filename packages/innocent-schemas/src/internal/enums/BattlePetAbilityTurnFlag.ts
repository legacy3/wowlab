import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum BattlePetAbilityTurnFlag {
  CanProcFromProc = 1,
  TriggerBySelf = 2,
  TriggerByFriend = 4,
  TriggerByEnemy = 8,
  TriggerByWeather = 16,
  TriggerByAuraCaster = 32,
}

export const BattlePetAbilityTurnFlagSchema = Schema.Enums(
  BattlePetAbilityTurnFlag,
);
