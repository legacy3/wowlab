import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum ItemConsumableSubclass {
  Generic = 0,
  Potion = 1,
  Elixir = 2,
  Flasksphials = 3,
  Scroll = 4,
  Fooddrink = 5,
  Itemenhancement = 6,
  Bandage = 7,
  Other = 8,
  VantusRune = 9,
  UtilityCurio = 10,
  CombatCurio = 11,
  Relic = 12,
}

export const ItemConsumableSubclassSchema = Schema.Enums(
  ItemConsumableSubclass,
);
