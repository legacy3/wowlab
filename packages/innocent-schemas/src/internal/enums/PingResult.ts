import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum PingResult {
  Success = 0,
  FailedGeneric = 1,
  FailedSpamming = 2,
  FailedDisabledByLeader = 3,
  FailedDisabledBySettings = 4,
  FailedOutOfPingArea = 5,
  FailedSquelched = 6,
  FailedUnspecified = 7,
}

export const PingResultSchema = Schema.Enums(PingResult);
