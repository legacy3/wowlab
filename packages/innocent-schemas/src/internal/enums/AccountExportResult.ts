import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum AccountExportResult {
  Success = 0,
  UnknownError = 1,
  Cancelled = 2,
  ShuttingDown = 3,
  TimedOut = 4,
  NoAccountFound = 5,
  RequestedInvalidCharacter = 6,
  RpcError = 7,
  FileInvalid = 8,
  FileWriteFailed = 9,
  Unavailable = 10,
  AlreadyInProgress = 11,
  FailedToLockAccount = 12,
  FailedToGenerateFile = 13,
}

export const AccountExportResultSchema = Schema.Enums(AccountExportResult);
