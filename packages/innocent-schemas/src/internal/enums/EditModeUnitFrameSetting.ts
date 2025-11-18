import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum EditModeUnitFrameSetting {
  HidePortrait = 0,
  CastBarUnderneath = 1,
  BuffsOnTop = 2,
  UseLargerFrame = 3,
  UseRaidStylePartyFrames = 4,
  ShowPartyFrameBackground = 5,
  UseHorizontalGroups = 6,
  CastBarOnSide = 7,
  ShowCastTime = 8,
  ViewRaidSize = 9,
  FrameWidth = 10,
  FrameHeight = 11,
  DisplayBorder = 12,
  RaidGroupDisplayType = 13,
  SortPlayersBy = 14,
  RowSize = 15,
  FrameSize = 16,
  ViewArenaSize = 17,
}

export const EditModeUnitFrameSettingSchema = Schema.Enums(
  EditModeUnitFrameSetting,
);
