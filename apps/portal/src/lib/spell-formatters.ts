import { format, formatDistanceToNow } from "date-fns";
import type { Tables } from "@/lib/supabase/database.types";

export type PropertyFormatter = (value: unknown) => string | null;

type SpellData = Tables<"spell_data">;
export type SpellDataKey = keyof SpellData;

export const formatSchoolMask = (value: unknown): string | null => {
  if (typeof value !== "number") {
    return null;
  }

  const schools: Record<number, string> = {
    1: "Physical",
    2: "Holy",
    4: "Fire",
    8: "Nature",
    16: "Frost",
    32: "Shadow",
    64: "Arcane",
  };

  return schools[value] || `Unknown (${value})`;
};

const formatNumberWithZero = (
  value: unknown,
  formatter: (n: number) => string,
  zeroValue = "None",
): string | null => {
  if (typeof value !== "number") {
    return null;
  }

  if (value === 0) {
    return zeroValue;
  }

  return formatter(value);
};

const formatTimeMs = (value: number): string => {
  return `${value / 1000}s`;
};

export const formatCastTime = (value: unknown): string | null => {
  if (typeof value !== "number") {
    return null;
  }

  return value === 0 ? "Instant" : `${value / 1000}s cast`;
};

export const formatDuration = (value: unknown): string | null => {
  return formatNumberWithZero(value, formatTimeMs);
};

export const formatTargeting = (value: unknown): string | null => {
  if (!Array.isArray(value) || value.length < 2) {
    return null;
  }

  const types: Record<number, string> = {
    0: "None",
    1: "Self",
    6: "Enemy",
    21: "Friend",
  };

  return `${types[value[0]] || value[0]} → ${types[value[1]] || value[1]}`;
};

export const formatAttributes = (value: unknown): string | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  const nonZero = value
    .map((val, idx) => {
      return val !== 0 ? `[${idx}]: ${val}` : null;
    })
    .filter(Boolean);

  return nonZero.length > 0 ? nonZero.join(", ") : "None";
};

export const formatManaCost = (value: unknown): string | null => {
  return formatNumberWithZero(value, (n) => {
    return `${n} mana`;
  });
};

export const formatCooldown = (value: unknown): string | null => {
  return formatNumberWithZero(value, formatTimeMs);
};

export const formatPropertyName = (key: string): string => {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
};

export const formatRechargeTime = (value: unknown): string | null => {
  return formatNumberWithZero(value, formatTimeMs);
};

export const formatGCD = (value: unknown): string | null => {
  return formatNumberWithZero(value, formatTimeMs);
};

export const formatMissileSpeed = (value: unknown): string | null => {
  return formatNumberWithZero(value, (n) => {
    return `${n} yards/sec`;
  });
};

export const formatRadius = (value: unknown): string | null => {
  if (!Array.isArray(value) || value.length === 0) {
    return "None";
  }

  const radiusStrings: string[] = [];
  for (const item of value) {
    if (typeof item === "object" && item !== null && "radius" in item) {
      radiusStrings.push(`${item.radius} yards`);
    }
  }

  return radiusStrings.length > 0 ? radiusStrings.join(", ") : "None";
};

export const formatEmpowerStages = (value: unknown): string | null => {
  if (!Array.isArray(value) || value.length === 0) {
    return "None";
  }

  const stageStrings: string[] = [];
  for (const item of value) {
    if (
      typeof item === "object" &&
      item !== null &&
      "stage" in item &&
      "duration" in item
    ) {
      stageStrings.push(`Stage ${item.stage}: ${item.duration}ms`);
    }
  }

  return stageStrings.length > 0 ? stageStrings.join(", ") : "None";
};

export const formatTimestamp = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return null;
  }

  const formatted = format(date, "PPpp");
  const relative = formatDistanceToNow(date, { addSuffix: true });

  return `${formatted} (${relative})`;
};

export const formatNumber = (value: unknown): string | null => {
  if (typeof value !== "number") {
    return null;
  }

  return value.toString();
};

export const formatString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  return value;
};

export const formatBoolean = (value: unknown): string | null => {
  if (typeof value !== "boolean") {
    return null;
  }

  return value ? "Yes" : "No";
};

export const formatJson = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  return JSON.stringify(value);
};

export const formatDegrees = (value: unknown): string | null => {
  return formatNumberWithZero(value, (n) => {
    return `${n}°`;
  });
};

export const formatYards = (value: unknown): string | null => {
  return formatNumberWithZero(
    value,
    (n) => {
      return `${n} yards`;
    },
    "0 yards",
  );
};

export const formatScaling = (value: unknown): string | null => {
  return formatNumberWithZero(value, (n) => {
    return `${n}%`;
  });
};

export const propertyFormatters: Record<SpellDataKey, PropertyFormatter> = {
  id: formatNumber,
  name: formatString,
  schoolMask: formatSchoolMask,
  castTime: formatCastTime,
  duration: formatDuration,
  durationMax: formatDuration,
  targeting: formatTargeting,
  attributes: formatAttributes,
  cooldown: formatCooldown,
  manaCost: formatManaCost,
  rechargeTime: formatRechargeTime,
  gcd: formatGCD,
  missileSpeed: formatMissileSpeed,
  radius: formatRadius,
  empowerStages: formatEmpowerStages,
  createdAt: formatTimestamp,
  updatedAt: formatTimestamp,
  canEmpower: formatBoolean,
  coneDegrees: formatDegrees,
  defenseType: formatNumber,
  dispelType: formatNumber,
  facingFlags: formatNumber,
  interruptAura0: formatNumber,
  interruptAura1: formatNumber,
  interruptChannel0: formatNumber,
  interruptChannel1: formatNumber,
  interruptFlags: formatNumber,
  maxCharges: formatNumber,
  rangeAllyMax: formatYards,
  rangeAllyMin: formatYards,
  rangeEnemyMax: formatYards,
  rangeEnemyMin: formatYards,
  scalingAttackPower: formatScaling,
  scalingSpellPower: formatScaling,
  triggers: formatJson,
  iconName: formatString,
};
