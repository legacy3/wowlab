/* eslint-disable perfectionist/sort-enums */
import * as Schema from "effect/Schema";

export enum PowerType {
  Mana = 0,
  Rage = 1,
  Focus = 2,
  Energy = 3,
  ComboPoints = 4,
  Runes = 5,
  RunicPower = 6,
  SoulShards = 7,
  LunarPower = 8,
  HolyPower = 9,
  Alternate = 10,
  Maelstrom = 11,
  Chi = 12,
  Insanity = 13,
  BurningEmbers = 14,
  DemonicFury = 15,
  ArcaneCharges = 16,
  Fury = 17,
  Pain = 18,
  Essence = 19,
  RuneBlood = 20,
  RuneFrost = 21,
  RuneUnholy = 22,
  AlternateQuest = 23,
  AlternateEncounter = 24,
  AlternateMount = 25,
  Balance = 26,
  Happiness = 27,
  ShadowOrbs = 28,
  RuneChromatic = 29,
}

export const PowerTypeSchema = Schema.Enums(PowerType);

export const Resource = PowerType;
export type Resource = PowerType;
export const ResourceSchema = PowerTypeSchema;

export enum SpellSchool {
  Physical = 0,
  Holy = 1,
  Fire = 2,
  Nature = 3,
  Frost = 4,
  Shadow = 5,
  Arcane = 6,
  FirstResist = 2,
  LastResist = 6,
  MaskNone = 0,
  MaskPhysical = 1,
  MaskHoly = 2,
  MaskFire = 4,
  MaskNature = 8,
  MaskFrost = 16,
  MaskShadow = 32,
  MaskArcane = 64,
  AllPhysical = 1,
  AllMagical = 126,
  All = 127,
  MaskFlamestrike = 5,
  MaskFroststrike = 17,
  MaskSpellstrike = 65,
  MaskShadowstrike = 33,
  MaskStormstrike = 9,
  MaskHolystrike = 3,
  MaskFrostfire = 20,
  MaskSpellfire = 68,
  MaskFirestorm = 12,
  MaskShadowflame = 36,
  MaskHolyfire = 6,
  MaskSpellfrost = 80,
  MaskFroststorm = 24,
  MaskShadowfrost = 48,
  MaskHolyfrost = 18,
  MaskSpellstorm = 72,
  MaskSpellshadow = 96,
  MaskDivine = 66,
  MaskShadowstorm = 40,
  MaskHolystorm = 10,
  MaskTwilight = 34,
  MaskElemental = 28,
  MaskChromatic = 62,
  MaskMagical = 126,
  MaskChaos = 124,
  MaskCosmic = 106,
}

export const SpellSchoolSchema = Schema.Enums(SpellSchool);

export enum ItemQuality {
  Poor = 0,
  Common = 1,
  Uncommon = 2,
  Rare = 3,
  Epic = 4,
  Legendary = 5,
  Artifact = 6,
  Heirloom = 7,
  WoWToken = 8,
}

export const ItemQualitySchema = Schema.Enums(ItemQuality);

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

export enum SpellEffect {
  SchoolDamage = 2,
  Heal = 10,
  PowerDrain = 30,
}

export const SpellEffectSchema = Schema.Enums(SpellEffect);
