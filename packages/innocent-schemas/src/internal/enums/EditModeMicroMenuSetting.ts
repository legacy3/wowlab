import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum EditModeMicroMenuSetting {
  Orientation = 0,
  Order = 1,
  Size = 2,
  EyeSize = 3,
}

export const EditModeMicroMenuSettingSchema = Schema.Enums(
  EditModeMicroMenuSetting,
);
