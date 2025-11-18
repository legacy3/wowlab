import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum PetbattleEffectFlags {
  None = 0,
  InvalidTarget = 1,
  Miss = 2,
  Crit = 4,
  Blocked = 8,
  Dodge = 16,
  Heal = 32,
  Unkillable = 64,
  Reflect = 128,
  Absorb = 256,
  Immune = 512,
  Strong = 1024,
  Weak = 2048,
  SuccessChain = 4096,
  AuraReapply = 8192,
}

export const PetbattleEffectFlagsSchema = Schema.Enums(PetbattleEffectFlags);
