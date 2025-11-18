import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum EditModeActionBarSetting {
  Orientation = 0,
  NumRows = 1,
  NumIcons = 2,
  IconSize = 3,
  IconPadding = 4,
  VisibleSetting = 5,
  HideBarArt = 6,
  DeprecatedSnapToSide = 7,
  HideBarScrolling = 8,
  AlwaysShowButtons = 9,
}

export const EditModeActionBarSettingSchema = Schema.Enums(
  EditModeActionBarSetting,
);
