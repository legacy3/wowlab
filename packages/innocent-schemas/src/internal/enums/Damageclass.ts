import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum Damageclass {
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

export const DamageclassSchema = Schema.Enums(Damageclass);
