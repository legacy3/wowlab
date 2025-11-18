export const ALL_POWER_TYPES = [
  "mana",
  "rage",
  "focus",
  "energy",
  "comboPoints",
  "runes",
  "runicPower",
  "soulShards",
  "lunarPower",
  "holyPower",
  "alternativePower",
  "maelstrom",
  "chi",
  "insanity",
  "burningEmbers",
  "demonicFury",
  "arcaneCharges",
  "fury",
  "pain",
] as const;

export type PowerKey = (typeof ALL_POWER_TYPES)[number];
