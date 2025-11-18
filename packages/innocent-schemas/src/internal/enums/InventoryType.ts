import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum InventoryType {
  IndexNonEquipType = 0,
  IndexHeadType = 1,
  IndexNeckType = 2,
  IndexShoulderType = 3,
  IndexBodyType = 4,
  IndexChestType = 5,
  IndexWaistType = 6,
  IndexLegsType = 7,
  IndexFeetType = 8,
  IndexWristType = 9,
  IndexHandType = 10,
  IndexFingerType = 11,
  IndexTrinketType = 12,
  IndexWeaponType = 13,
  IndexShieldType = 14,
  IndexRangedType = 15,
  IndexCloakType = 16,
  Index2HweaponType = 17,
  IndexBagType = 18,
  IndexTabardType = 19,
  IndexRobeType = 20,
  IndexWeaponmainhandType = 21,
  IndexWeaponoffhandType = 22,
  IndexHoldableType = 23,
  IndexAmmoType = 24,
  IndexThrownType = 25,
  IndexRangedrightType = 26,
  IndexQuiverType = 27,
  IndexRelicType = 28,
  IndexProfessionToolType = 29,
  IndexProfessionGearType = 30,
  IndexEquipablespellOffensiveType = 31,
  IndexEquipablespellUtilityType = 32,
  IndexEquipablespellDefensiveType = 33,
  IndexEquipablespellWeaponType = 34,
}

export const InventoryTypeSchema = Schema.Enums(InventoryType);
