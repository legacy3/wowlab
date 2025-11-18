import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum ClientSettingsConfigFlag {
  ClientSettingsConfigDebug = 1,
  ClientSettingsConfigInternal = 2,
  ClientSettingsConfigPerf = 4,
  ClientSettingsConfigGm = 8,
  ClientSettingsConfigTest = 16,
  ClientSettingsConfigTestRetail = 32,
  ClientSettingsConfigBeta = 64,
  ClientSettingsConfigBetaRetail = 128,
  ClientSettingsConfigRetail = 256,
}

export const ClientSettingsConfigFlagSchema = Schema.Enums(
  ClientSettingsConfigFlag,
);
