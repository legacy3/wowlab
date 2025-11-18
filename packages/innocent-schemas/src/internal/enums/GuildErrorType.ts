import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum GuildErrorType {
  Success = 0,
  UnknownError = 1,
  AlreadyInGuild = 2,
  TargetAlreadyInGuild = 3,
  InvitedToGuild = 4,
  TargetInvitedToGuild = 5,
  NameInvalid = 6,
  NameAlreadyExists = 7,
  NoPermisson = 8,
  NotInGuild = 9,
  TargetNotInGuild = 10,
  PlayerNotFound = 11,
  WrongFaction = 12,
  TargetTooHigh = 13,
  TargetTooLow = 14,
  TooManyRanks = 15,
  TooFewRanks = 16,
  RanksLocked = 17,
  RankInUse = 18,
  Ignored = 19,
  Busy = 20,
  TargetLevelTooLow = 21,
  TargetLevelTooHigh = 22,
  TooManyMembers = 23,
  InvalidBankTab = 24,
  WithdrawLimit = 25,
  NotEnoughMoney = 26,
  TeamNotFound = 27,
  BankTabFull = 28,
  BadItem = 29,
  TeamsLocked = 30,
  TooMuchMoney = 31,
  WrongBankTab = 32,
  TooManyCreate = 33,
  RankRequiresAuthenticator = 34,
  BankTabLocked = 35,
  TrialAccount = 36,
  VeteranAccount = 37,
  UndeletableDueToLevel = 38,
  LockedForMove = 39,
  GuildRepTooLow = 40,
  CantInviteSelf = 41,
  HasRestriction = 42,
  BankNotFound = 43,
  NewLeaderWrongFaction = 44,
  GuildBankNotAvailable = 45,
  NewLeaderWrongRealm = 46,
  DeleteNoAppropriateLeader = 47,
  RealmMismatch = 48,
  InCooldown = 49,
  ReservationExpired = 50,
}

export const GuildErrorTypeSchema = Schema.Enums(GuildErrorType);
