import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum BattlepetDbFlags {
  None = 0,
  Favorite = 1,
  Converted = 2,
  Revoked = 4,
  LockedForConvert = 8,
  Ability0Selection = 16,
  Ability1Selection = 32,
  Ability2Selection = 64,
  FanfareNeeded = 128,
  DisplayOverridden = 256,
  AcquiredViaLicense = 512,
  TradingPost = 1024,
  LockMask = 12,
}

export const BattlepetDbFlagsSchema = Schema.Enums(BattlepetDbFlags);
