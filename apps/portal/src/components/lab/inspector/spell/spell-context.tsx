"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface SpellEffect {
  index: number;
  effectType: string;
  effectTypeId: number;
  auraType: string | null;
  auraTypeId?: number;
  basePoints: number;
  coefficient: number;
  apCoefficient: number;
  variance: number;
  pvpMultiplier: number;
  chainTargets: number;
  radiusMin: number;
  radiusMax: number;
  target: string;
  targetId: number;
  triggerSpell: number | null;
  auraPeriod: number | null;
  duration: number | null;
}

export interface SpellData {
  id: number;
  name: string;
  description: string;
  iconName: string;
  isPassive: boolean;
  castTime: number;
  cooldown: number;
  gcd: number;
  range: { min: number; max: number };
  cost: { type: string; amount: number };
  school: string;
  dispelType: string | null;
  mechanic: string | null;
  charges: number | null;
  effects: SpellEffect[];
  procData: unknown | null;
  triggersSpells: { id: number; name: string }[];
  scalingClass: number;
  scalingClassName: string;
  minScalingLevel: number;
  maxScalingLevel: number;
  difficultyOverrides: {
    difficulty: string;
    difficultyId: number;
    changes: { pvpMultiplier?: number } | null;
  }[];
  attributes: {
    index: number;
    value: number;
    flags: { name: string; set: boolean }[];
  }[];
  spellClassSet: number;
  spellClassSetName: string;
  spellClassMask: number[];
  modifiedBy: { id: number; name: string; description: string }[];
  auraRestrictions: {
    casterMustHave: string[];
    casterMustNotHave: string[];
    targetMustHave: string[];
    targetMustNotHave: string[];
  };
  shapeshiftRequirements: {
    requiredForms: string[];
    excludedForms: string[];
  };
  labels: { id: number; name: string }[];
  relatedSpells: {
    replaces: { id: number; name: string } | null;
    replacedBy: { id: number; name: string } | null;
    learnsOnCast: { id: number; name: string }[];
    triggeredByThis: { id: number; name: string }[];
    triggersThis: { id: number; name: string }[];
  };
  empowerData: unknown | null;
  rawData: {
    spell: Record<string, unknown>;
    spellMisc: Record<string, unknown>;
    spellEffect: Record<string, unknown>[];
  };
  simulationNotes: {
    baseDamageCoefficient: string;
    dotCoefficient: string;
    castTimeAffectedByHaste: boolean;
    gcdAffectedByHaste: boolean;
    cooldownAffectedByHaste: boolean;
    canCrit: boolean;
    notes: string[];
  };
}

export const MOCK_SPELL_AIMED_SHOT: SpellData = {
  id: 19434,
  name: "Aimed Shot",
  description:
    "A powerful aimed shot that deals 248% of Attack Power as Physical damage.",
  iconName: "ability_hunter_aimedshot",
  isPassive: false,
  castTime: 2500,
  cooldown: 12000,
  gcd: 1500,
  range: { min: 0, max: 40 },
  cost: { type: "Focus", amount: 35 },
  school: "Physical",
  dispelType: null,
  mechanic: null,
  charges: null,
  effects: [
    {
      index: 0,
      effectType: "SCHOOL_DAMAGE",
      effectTypeId: 2,
      auraType: null,
      basePoints: 0,
      coefficient: 2.48,
      apCoefficient: 0.0,
      variance: 0.05,
      pvpMultiplier: 1.0,
      chainTargets: 0,
      radiusMin: 0,
      radiusMax: 0,
      target: "TARGET_UNIT_TARGET_ENEMY",
      targetId: 6,
      triggerSpell: null,
      auraPeriod: null,
      duration: null,
    },
    {
      index: 1,
      effectType: "APPLY_AURA",
      effectTypeId: 6,
      auraType: "PERIODIC_DAMAGE",
      auraTypeId: 3,
      basePoints: 0,
      coefficient: 0.62,
      apCoefficient: 0.0,
      variance: 0,
      pvpMultiplier: 1.0,
      chainTargets: 0,
      radiusMin: 0,
      radiusMax: 0,
      target: "TARGET_UNIT_TARGET_ENEMY",
      targetId: 6,
      triggerSpell: null,
      auraPeriod: 2000,
      duration: 6000,
    },
  ],
  procData: null,
  triggersSpells: [{ id: 378888, name: "Trick Shots" }],
  scalingClass: -7,
  scalingClassName: "Hunter",
  minScalingLevel: 1,
  maxScalingLevel: 80,
  difficultyOverrides: [
    { difficulty: "Normal", difficultyId: 1, changes: null },
    { difficulty: "Heroic", difficultyId: 2, changes: null },
    { difficulty: "Mythic", difficultyId: 16, changes: null },
    {
      difficulty: "Mythic+",
      difficultyId: 8,
      changes: { pvpMultiplier: 0.85 },
    },
  ],
  attributes: [
    { index: 0, value: 0x00000000, flags: [] },
    {
      index: 1,
      value: 0x00400000,
      flags: [{ name: "ATTR1_CHANNEL_TRACK_TARGET", set: true }],
    },
    { index: 2, value: 0x00000000, flags: [] },
    { index: 3, value: 0x00000000, flags: [] },
    { index: 4, value: 0x00000000, flags: [] },
    { index: 5, value: 0x00000000, flags: [] },
    { index: 6, value: 0x00000000, flags: [] },
    { index: 7, value: 0x00000000, flags: [] },
  ],
  spellClassSet: 9,
  spellClassSetName: "Hunter",
  spellClassMask: [0x00000001, 0x00000000, 0x00000000, 0x00000000],
  modifiedBy: [
    {
      id: 260228,
      name: "Careful Aim",
      description: "+50% crit when target >70% HP",
    },
    {
      id: 257621,
      name: "Trick Shots",
      description: "Ricochet to nearby enemies",
    },
    {
      id: 378888,
      name: "Serpentstalker's Trickery",
      description: "30% proc for aimed shot",
    },
  ],
  auraRestrictions: {
    casterMustHave: [],
    casterMustNotHave: [],
    targetMustHave: [],
    targetMustNotHave: [],
  },
  shapeshiftRequirements: {
    requiredForms: [],
    excludedForms: [],
  },
  labels: [
    { id: 17, name: "Shot" },
    { id: 235, name: "Marksmanship" },
    { id: 1024, name: "Focus Spender" },
  ],
  relatedSpells: {
    replaces: null,
    replacedBy: null,
    learnsOnCast: [],
    triggeredByThis: [
      { id: 378888, name: "Trick Shots Damage" },
      { id: 389879, name: "Careful Aim Buff" },
    ],
    triggersThis: [],
  },
  empowerData: null,
  rawData: {
    spell: { ID: 19434, Name_lang: "Aimed Shot" },
    spellMisc: { ID: 19434, CastingTimeIndex: 12, DurationIndex: 0 },
    spellEffect: [
      { ID: 123456, EffectIndex: 0, Effect: 2, SpellID: 19434 },
      { ID: 123457, EffectIndex: 1, Effect: 6, SpellID: 19434 },
    ],
  },
  simulationNotes: {
    baseDamageCoefficient: "2.48 * Attack Power",
    dotCoefficient: "0.62 * Attack Power over 6s (3 ticks)",
    castTimeAffectedByHaste: true,
    gcdAffectedByHaste: true,
    cooldownAffectedByHaste: false,
    canCrit: true,
    notes: [
      "Careful Aim talent increases crit by 50% when target HP > 70%",
      "Trick Shots talent causes ricochet damage to nearby targets",
      "Lock and Load talent can make this instant cast",
    ],
  },
};

const SpellContext = createContext<SpellData | null>(null);

export function SpellProvider({
  spell,
  children,
}: {
  spell: SpellData;
  children: ReactNode;
}) {
  return (
    <SpellContext.Provider value={spell}>{children}</SpellContext.Provider>
  );
}

export function useSpellData(): SpellData {
  const context = useContext(SpellContext);
  if (!context) {
    throw new Error("useSpellData must be used within a SpellProvider");
  }

  return context;
}

// TODO Shared utility
export function formatTime(ms: number | null): string {
  if (ms === null) {
    return "-";
  }

  if (ms === 0) {
    return "Instant";
  }

  if (ms < 1000) {
    return `${ms}ms`;
  }

  return `${(ms / 1000).toFixed(1)}s`;
}

// TODO Shared utility
export function formatHex(value: number): string {
  return `0x${value.toString(16).toUpperCase().padStart(8, "0")}`;
}
