import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum ValidateNameResult {
  Success = 0,
  Failure = 1,
  NoName = 2,
  TooShort = 3,
  TooLong = 4,
  InvalidCharacter = 5,
  MixedLanguages = 6,
  Profane = 7,
  Reserved = 8,
  InvalidApostrophe = 9,
  MultipleApostrophes = 10,
  ThreeConsecutive = 11,
  InvalidSpace = 12,
  ConsecutiveSpaces = 13,
  RussianConsecutiveSilentCharacters = 14,
  RussianSilentCharacterAtBeginningOrEnd = 15,
  DeclensionDoesntMatchBaseName = 16,
  SpacesDisallowed = 17,
}

export const ValidateNameResultSchema = Schema.Enums(ValidateNameResult);
