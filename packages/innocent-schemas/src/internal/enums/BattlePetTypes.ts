import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum BattlePetTypes {
  Humanoid = 0,
  Dragonkin = 1,
  Flying = 2,
  Undead = 3,
  Critter = 4,
  Magic = 5,
  Elemental = 6,
  Beast = 7,
  Aquatic = 8,
  Mechanical = 9,
}

export const BattlePetTypesSchema = Schema.Enums(BattlePetTypes);
