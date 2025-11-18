import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum GarrAutoPreviewTargetType {
  None = 0,
  Damage = 1,
  Heal = 2,
  Buff = 4,
  Debuff = 8,
}

export const GarrAutoPreviewTargetTypeSchema = Schema.Enums(
  GarrAutoPreviewTargetType,
);
