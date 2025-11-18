import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum ItemSubclassFlag {
  WeaponsubclassCanparry = 1,
  WeaponsubclassSetfingerseq = 2,
  WeaponsubclassIsunarmed = 4,
  WeaponsubclassIsrifle = 8,
  WeaponsubclassIsthrown = 16,
  WeaponsubclassRighthandRanged = 32,
  ItemsubclassQuivernotrequired = 64,
  WeaponsubclassRanged = 128,
  WeaponsubclassDeprecatedReuseMe = 256,
  ItemsubclassUsesInvtype = 512,
  ArmorsubclassLfgscalingarmor = 1024,
}

export const ItemSubclassFlagSchema = Schema.Enums(ItemSubclassFlag);
