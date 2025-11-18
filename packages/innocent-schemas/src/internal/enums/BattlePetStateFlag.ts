import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum BattlePetStateFlag {
  None = 0,
  SwapOutLock = 1,
  TurnLock = 2,
  SpeedBonus = 4,
  Client = 8,
  MaxHealthBonus = 16,
  Stamina = 32,
  QualityDoesNotEffect = 64,
  DynamicScaling = 128,
  Power = 256,
  SpeedMult = 512,
  SwapInLock = 1024,
  ServerOnly = 2048,
}

export const BattlePetStateFlagSchema = Schema.Enums(BattlePetStateFlag);
