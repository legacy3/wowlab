import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum AccountCurrencyTransferResult {
  Success = 0,
  InvalidCharacter = 1,
  CharacterLoggedIn = 2,
  InsufficientCurrency = 3,
  MaxQuantity = 4,
  InvalidCurrency = 5,
  NoValidSourceCharacter = 6,
  ServerError = 7,
  CannotUseCurrency = 8,
  TransactionInProgress = 9,
  CurrencyTransferDisabled = 10,
}

export const AccountCurrencyTransferResultSchema = Schema.Enums(
  AccountCurrencyTransferResult,
);
