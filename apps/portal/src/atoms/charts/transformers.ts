"use client";

import type { CombatData } from "@/atoms/timeline";
import { SPELLS } from "@/atoms/timeline/constants";
import type {
  DpsDataPoint,
  ResourceDataPoint,
  AbilityUsageDataPoint,
  CooldownEvent,
  DetailedDataPoint,
} from "./state";

// Chart colors for abilities
const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

/**
 * Transform combat data to DPS chart format.
 * Aggregates damage into time windows and calculates running average.
 */
export function transformToDpsChartData(
  combatData: CombatData,
  windowSize = 5,
): DpsDataPoint[] {
  const { damage } = combatData;
  if (damage.length === 0) return [];

  // Find max timestamp
  const maxTime = Math.max(...damage.map((d) => d.timestamp));
  const data: DpsDataPoint[] = [];

  let cumulativeDamage = 0;

  for (let t = 0; t <= maxTime; t += windowSize) {
    // Sum damage in this window
    const windowDamage = damage
      .filter((d) => d.timestamp >= t && d.timestamp < t + windowSize)
      .reduce((sum, d) => sum + d.amount, 0);

    cumulativeDamage += windowDamage;

    // Instantaneous DPS for this window
    const instantaneousDps = Math.round(windowDamage / windowSize);

    // Running average DPS
    const runningAvg =
      t > 0 ? Math.round(cumulativeDamage / t) : instantaneousDps;

    data.push({
      time: t,
      dps: instantaneousDps,
      running_avg: runningAvg,
    });
  }

  return data;
}

/**
 * Transform combat data to resource chart format.
 * Uses resource snapshots to show focus/mana over time.
 */
export function transformToResourceChartData(
  combatData: CombatData,
): ResourceDataPoint[] {
  const { resources } = combatData;
  if (resources.length === 0) return [];

  const data: ResourceDataPoint[] = [];
  let totalSpent = 0;
  let previousFocus = resources[0]?.focus ?? 100;

  for (const resource of resources) {
    // Calculate spent as focus decrease (if any)
    const spent = Math.max(0, previousFocus - resource.focus);
    totalSpent += spent;

    data.push({
      time: resource.timestamp,
      mana: resource.focus, // Using "mana" field name for compatibility
      mana_spent: totalSpent,
    });

    previousFocus = resource.focus;
  }

  return data;
}

/**
 * Transform combat data to ability usage chart format.
 * Groups casts by spell and sums damage.
 */
export function transformToAbilityChartData(
  combatData: CombatData,
): AbilityUsageDataPoint[] {
  const { casts, damage } = combatData;

  // Group casts by spell ID
  const castsBySpell = new Map<number, number>();
  for (const cast of casts) {
    if (cast.successful) {
      const count = castsBySpell.get(cast.spellId) ?? 0;
      castsBySpell.set(cast.spellId, count + 1);
    }
  }

  // Group damage by spell ID
  const damageBySpell = new Map<number, number>();
  for (const dmg of damage) {
    const total = damageBySpell.get(dmg.spellId) ?? 0;
    damageBySpell.set(dmg.spellId, total + dmg.amount);
  }

  // Build result array
  const data: AbilityUsageDataPoint[] = [];
  let colorIdx = 0;

  for (const [spellId, castCount] of castsBySpell) {
    const spellInfo = SPELLS[spellId];
    const spellName = spellInfo?.name ?? `Spell ${spellId}`;
    const spellDamage = damageBySpell.get(spellId) ?? 0;

    data.push({
      ability: spellName,
      casts: castCount,
      damage: spellDamage,
      fill: CHART_COLORS[colorIdx % CHART_COLORS.length],
    });

    colorIdx++;
  }

  // Sort by damage descending
  data.sort((a, b) => b.damage - a.damage);

  // Re-assign colors in sorted order
  return data.map((item, idx) => ({
    ...item,
    fill: CHART_COLORS[idx % CHART_COLORS.length],
  }));
}

/**
 * Transform combat data to cooldown chart format.
 * Extracts major cooldowns from buff applications.
 */
export function transformToCooldownChartData(
  combatData: CombatData,
): CooldownEvent[] {
  const { buffs } = combatData;

  // Major cooldown spell IDs (BM Hunter example)
  const majorCooldowns = new Set([
    19574, // Bestial Wrath
    359844, // Call of the Wild
    321530, // Bloodshed
    186265, // Aspect of the Turtle
  ]);

  const data: CooldownEvent[] = [];

  for (const buff of buffs) {
    if (majorCooldowns.has(buff.spellId) && buff.target === "Player") {
      const spellInfo = SPELLS[buff.spellId];
      const duration = buff.end - buff.start;

      data.push({
        time: buff.start,
        ability: spellInfo?.name ?? `Spell ${buff.spellId}`,
        duration,
      });
    }
  }

  // Sort by time
  return data.sort((a, b) => a.time - b.time);
}

/**
 * Transform combat data to detailed chart format.
 * Combines cumulative damage, DPS, and resources over time.
 */
export function transformToDetailedChartData(
  combatData: CombatData,
  windowSize = 10,
): DetailedDataPoint[] {
  const { damage, resources } = combatData;
  if (damage.length === 0) return [];

  // Find max timestamp
  const maxTime = Math.max(
    ...damage.map((d) => d.timestamp),
    ...resources.map((r) => r.timestamp),
  );

  const data: DetailedDataPoint[] = [];
  let cumulativeDamage = 0;
  let lastResourceIdx = 0;

  for (let t = 0; t <= maxTime; t += windowSize) {
    // Sum damage up to this point
    const damageInWindow = damage
      .filter((d) => d.timestamp >= t - windowSize && d.timestamp < t)
      .reduce((sum, d) => sum + d.amount, 0);

    cumulativeDamage += damageInWindow;

    // DPS at this point
    const dps = t > 0 ? Math.round(cumulativeDamage / t) : 0;

    // Find closest resource value
    while (
      lastResourceIdx < resources.length - 1 &&
      resources[lastResourceIdx + 1].timestamp <= t
    ) {
      lastResourceIdx++;
    }
    const resourceValue =
      resources[lastResourceIdx]?.focus ?? resources[0]?.focus ?? 100;

    data.push({
      time: t,
      damage: cumulativeDamage,
      dps,
      mana: resourceValue,
    });
  }

  return data;
}
