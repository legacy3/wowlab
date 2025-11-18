import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum ItemWeaponSubclass {
  Axe1H = 0,
  Axe2H = 1,
  Bows = 2,
  Guns = 3,
  Mace1H = 4,
  Mace2H = 5,
  Polearm = 6,
  Sword1H = 7,
  Sword2H = 8,
  Warglaive = 9,
  Staff = 10,
  Bearclaw = 11,
  Catclaw = 12,
  Unarmed = 13,
  Generic = 14,
  Dagger = 15,
  Thrown = 16,
  Obsolete3 = 17,
  Crossbow = 18,
  Wand = 19,
  Fishingpole = 20,
}

export const ItemWeaponSubclassSchema = Schema.Enums(ItemWeaponSubclass);
