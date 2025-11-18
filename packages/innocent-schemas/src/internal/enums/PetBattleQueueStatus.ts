import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum PetBattleQueueStatus {
  None = 0,
  Queued = 1,
  QueuedUpdate = 2,
  AlreadyQueued = 3,
  JoinFailed = 4,
  JoinFailedSlots = 5,
  JoinFailedJournalLock = 6,
  JoinFailedNeutral = 7,
  MatchAccepted = 8,
  MatchDeclined = 9,
  MatchOpponentDeclined = 10,
  ProposalTimedOut = 11,
  Removed = 12,
  RequeuedAfterInternalError = 13,
  RequeuedAfterOpponentRemoved = 14,
  Matchmaking = 15,
  LostConnection = 16,
  Shutdown = 17,
  Suspended = 18,
  Unsuspended = 19,
  InBattle = 20,
  NoBattlingHere = 21,
}

export const PetBattleQueueStatusSchema = Schema.Enums(PetBattleQueueStatus);
