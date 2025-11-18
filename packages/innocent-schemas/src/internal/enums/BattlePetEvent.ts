import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum BattlePetEvent {
  OnAuraApplied = 0,
  OnDamageTaken = 1,
  OnDamageDealt = 2,
  OnHealTaken = 3,
  OnHealDealt = 4,
  OnAuraRemoved = 5,
  OnRoundStart = 6,
  OnRoundEnd = 7,
  OnTurn = 8,
  OnAbility = 9,
  OnSwapIn = 10,
  OnSwapOut = 11,
  PostAuraTicks = 12,
}

export const BattlePetEventSchema = Schema.Enums(BattlePetEvent);
