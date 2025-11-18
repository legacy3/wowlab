import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum BattlePetNpcEmote {
  BattleUnused = 0,
  BattleStart = 1,
  BattleWin = 2,
  BattleLose = 3,
  PetSwap = 4,
  PetKill = 5,
  PetDie = 6,
  PetAbility = 7,
}

export const BattlePetNpcEmoteSchema = Schema.Enums(BattlePetNpcEmote);
