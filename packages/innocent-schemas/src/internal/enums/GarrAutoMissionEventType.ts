import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum GarrAutoMissionEventType {
  MeleeDamage = 0,
  RangeDamage = 1,
  SpellMeleeDamage = 2,
  SpellRangeDamage = 3,
  Heal = 4,
  PeriodicDamage = 5,
  PeriodicHeal = 6,
  ApplyAura = 7,
  RemoveAura = 8,
  Died = 9,
}

export const GarrAutoMissionEventTypeSchema = Schema.Enums(
  GarrAutoMissionEventType,
);
