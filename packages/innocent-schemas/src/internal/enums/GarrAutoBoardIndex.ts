import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum GarrAutoBoardIndex {
  None = -1,
  AllyLeftBack = 0,
  AllyRightBack = 1,
  AllyLeftFront = 2,
  AllyCenterFront = 3,
  AllyRightFront = 4,
  EnemyLeftFront = 5,
  EnemyCenterLeftFront = 6,
  EnemyCenterRightFront = 7,
  EnemyRightFront = 8,
  EnemyLeftBack = 9,
  EnemyCenterLeftBack = 10,
  EnemyCenterRightBack = 11,
  EnemyRightBack = 12,
}

export const GarrAutoBoardIndexSchema = Schema.Enums(GarrAutoBoardIndex);
