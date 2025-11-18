import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum SoulbindConduitInstallResult {
  Success = 0,
  InvalidItem = 1,
  InvalidConduit = 2,
  InvalidTalent = 3,
  DuplicateConduit = 4,
  ForgeNotInProximity = 5,
  SocketNotEmpty = 6,
}

export const SoulbindConduitInstallResultSchema = Schema.Enums(
  SoulbindConduitInstallResult,
);
