import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum BattlepetSlotLockCheat {
  Cheat_2_Locked = -3,
  Cheat_1_Locked = -2,
  Cheat_0_Locked = -1,
  CheatOff = 0,
  UnlockAll = 1,
}

export const BattlepetSlotLockCheatSchema = Schema.Enums(
  BattlepetSlotLockCheat,
);
