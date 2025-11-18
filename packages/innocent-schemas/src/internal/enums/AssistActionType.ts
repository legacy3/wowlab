import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum AssistActionType {
  None = 0,
  LoungingPlayer = 1,
  GraveMarker = 2,
  PlacedVo = 3,
  PlayerGuardian = 4,
  PlayerSlayer = 5,
  CapturedBuff = 6,
}

export const AssistActionTypeSchema = Schema.Enums(AssistActionType);
