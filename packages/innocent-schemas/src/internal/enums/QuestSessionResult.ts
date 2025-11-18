import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum QuestSessionResult {
  Ok = 0,
  NotInParty = 1,
  InvalidOwner = 2,
  AlreadyActive = 3,
  NotActive = 4,
  InRaid = 5,
  OwnerRefused = 6,
  Timeout = 7,
  Disabled = 8,
  Started = 9,
  Stopped = 10,
  Joined = 11,
  Left = 12,
  OwnerLeft = 13,
  ReadyCheckFailed = 14,
  PartyDestroyed = 15,
  MemberTimeout = 16,
  AlreadyMember = 17,
  NotOwner = 18,
  AlreadyOwner = 19,
  AlreadyJoined = 20,
  NotMember = 21,
  Busy = 22,
  JoinRejected = 23,
  Logout = 24,
  Empty = 25,
  QuestNotCompleted = 26,
  Resync = 27,
  Restricted = 28,
  InPetBattle = 29,
  InvalidPublicParty = 30,
  Unknown = 31,
  InCombat = 32,
  MemberInCombat = 33,
  RestrictedCrossFaction = 34,
}

export const QuestSessionResultSchema = Schema.Enums(QuestSessionResult);
