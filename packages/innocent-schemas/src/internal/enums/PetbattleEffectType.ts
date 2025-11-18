import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum PetbattleEffectType {
  SetHealth = 0,
  AuraApply = 1,
  AuraCancel = 2,
  AuraChange = 3,
  PetSwap = 4,
  StatusChange = 5,
  SetState = 6,
  SetMaxHealth = 7,
  SetSpeed = 8,
  SetPower = 9,
  TriggerAbility = 10,
  AbilityChange = 11,
  NpcEmote = 12,
  AuraProcessingBegin = 13,
  AuraProcessingEnd = 14,
  ReplacePet = 15,
  OverrideAbility = 16,
  WorldStateUpdate = 17,
}

export const PetbattleEffectTypeSchema = Schema.Enums(PetbattleEffectType);
