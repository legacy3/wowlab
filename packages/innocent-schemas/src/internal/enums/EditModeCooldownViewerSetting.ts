import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum EditModeCooldownViewerSetting {
  Orientation = 0,
  IconLimit = 1,
  IconDirection = 2,
  IconSize = 3,
  IconPadding = 4,
  Opacity = 5,
  VisibleSetting = 6,
  BarContent = 7,
  HideWhenInactive = 8,
  ShowTimer = 9,
  ShowTooltips = 10,
}

export const EditModeCooldownViewerSettingSchema = Schema.Enums(
  EditModeCooldownViewerSetting,
);
