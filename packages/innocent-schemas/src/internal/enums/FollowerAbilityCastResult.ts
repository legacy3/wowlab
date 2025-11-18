import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum FollowerAbilityCastResult {
  Success = 0,
  Failure = 1,
  NoPendingCast = 2,
  InvalidTarget = 3,
  InvalidFollowerSpell = 4,
  RerollNotAllowed = 5,
  SingleMissionDuration = 6,
  MustTargetFollower = 7,
  MustTargetTrait = 8,
  InvalidFollowerType = 9,
  MustBeUnique = 10,
  CannotTargetLimitedUseFollower = 11,
  MustTargetLimitedUseFollower = 12,
  AlreadyAtMaxDurability = 13,
  CannotTargetNonAutoMissionFollower = 14,
}

export const FollowerAbilityCastResultSchema = Schema.Enums(
  FollowerAbilityCastResult,
);
