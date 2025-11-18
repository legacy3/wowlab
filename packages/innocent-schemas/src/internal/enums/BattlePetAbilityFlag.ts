import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

export enum BattlePetAbilityFlag {
  DisplayAsHostileDebuff = 1,
  HideStrongWeakHints = 2,
  Passive = 4,
  ServerOnlyAura = 8,
  ShowCast = 16,
  StartOnCooldown = 32,
}

export const BattlePetAbilityFlagSchema = Schema.Enums(BattlePetAbilityFlag);
