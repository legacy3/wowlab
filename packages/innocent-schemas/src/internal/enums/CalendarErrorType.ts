import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum CalendarErrorType {
  Success = 0,
  CommunityEventsExceeded = 1,
  EventsExceeded = 2,
  SelfInvitesExceeded = 3,
  OtherInvitesExceeded = 4,
  NoPermission = 5,
  EventInvalid = 6,
  NotInvited = 7,
  UnknownError = 8,
  NotInGuild = 9,
  NotInCommunity = 10,
  TargetAlreadyInvited = 11,
  NameNotFound = 12,
  WrongFaction = 13,
  Ignored = 14,
  InvitesExceeded = 15,
  InvalidMaxSize = 16,
  InvalidDate = 17,
  InvalidTime = 18,
  NoInvites = 19,
  NeedsTitle = 20,
  EventPassed = 21,
  EventLocked = 22,
  DeleteCreatorFailed = 23,
  DataAlreadySet = 24,
  CalendarDisabled = 25,
  RestrictedAccount = 26,
  ArenaEventsExceeded = 27,
  RestrictedLevel = 28,
  Squelched = 29,
  NoInvite = 30,
  ComplaintDisabled = 31,
  ComplaintSelf = 32,
  ComplaintSameGuild = 33,
  ComplaintGm = 34,
  ComplaintLimit = 35,
  ComplaintNotFound = 36,
  EventWrongServer = 37,
  NoCommunityInvites = 38,
  InvalidSignup = 39,
  NoModerator = 40,
  ModeratorRestricted = 41,
  InvalidNotes = 42,
  InvalidTitle = 43,
  InvalidDescription = 44,
  InvalidClub = 45,
  CreatorNotFound = 46,
  EventThrottled = 47,
  InviteThrottled = 48,
  Internal = 49,
  ComplaintAdded = 50,
}

export const CalendarErrorTypeSchema = Schema.Enums(CalendarErrorType);
