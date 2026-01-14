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

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function transformToDpsChartData(
  combatData: CombatData,
  windowSize = 5,
): DpsDataPoint[] {
  const { damage } = combatData;
  if (damage.length === 0) {
    return [];
  }

  const maxTime = Math.max(...damage.map((d) => d.timestamp));
  const data: DpsDataPoint[] = [];
  let cumulativeDamage = 0;

  for (let t = 0; t <= maxTime; t += windowSize) {
    const windowDamage = damage
      .filter((d) => d.timestamp >= t && d.timestamp < t + windowSize)
      .reduce((sum, d) => sum + d.amount, 0);

    cumulativeDamage += windowDamage;

    const instantaneousDps = Math.round(windowDamage / windowSize);
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

export function transformToResourceChartData(
  combatData: CombatData,
): ResourceDataPoint[] {
  const { resources } = combatData;
  if (resources.length === 0) {
    return [];
  }

  const data: ResourceDataPoint[] = [];
  let totalSpent = 0;
  let previousFocus = resources[0]?.focus ?? 100;

  for (const resource of resources) {
    const spent = Math.max(0, previousFocus - resource.focus);
    totalSpent += spent;

    data.push({
      time: resource.timestamp,
      mana: resource.focus,
      mana_spent: totalSpent,
    });

    previousFocus = resource.focus;
  }

  return data;
}

export function transformToAbilityChartData(
  combatData: CombatData,
): AbilityUsageDataPoint[] {
  const { casts, damage } = combatData;

  const castsBySpell = new Map<number, number>();
  for (const cast of casts) {
    if (cast.successful) {
      const count = castsBySpell.get(cast.spellId) ?? 0;
      castsBySpell.set(cast.spellId, count + 1);
    }
  }

  const damageBySpell = new Map<number, number>();
  for (const dmg of damage) {
    const total = damageBySpell.get(dmg.spellId) ?? 0;
    damageBySpell.set(dmg.spellId, total + dmg.amount);
  }

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

  data.sort((a, b) => b.damage - a.damage);

  return data.map((item, idx) => ({
    ...item,
    fill: CHART_COLORS[idx % CHART_COLORS.length],
  }));
}

const MAJOR_COOLDOWN_IDS = new Set([
  19574, // Bestial Wrath
  359844, // Call of the Wild
  321530, // Bloodshed
  186265, // Aspect of the Turtle
]);

export function transformToCooldownChartData(
  combatData: CombatData,
): CooldownEvent[] {
  const { buffs } = combatData;
  const data: CooldownEvent[] = [];

  for (const buff of buffs) {
    if (MAJOR_COOLDOWN_IDS.has(buff.spellId) && buff.target === "Player") {
      const spellInfo = SPELLS[buff.spellId];
      data.push({
        time: buff.start,
        ability: spellInfo?.name ?? `Spell ${buff.spellId}`,
        duration: buff.end - buff.start,
      });
    }
  }

  return data.sort((a, b) => a.time - b.time);
}

export function transformToDetailedChartData(
  combatData: CombatData,
  windowSize = 10,
): DetailedDataPoint[] {
  const { damage, resources } = combatData;
  if (damage.length === 0) {
    return [];
  }

  const maxTime = Math.max(
    ...damage.map((d) => d.timestamp),
    ...resources.map((r) => r.timestamp),
  );

  const data: DetailedDataPoint[] = [];
  let cumulativeDamage = 0;
  let lastResourceIdx = 0;

  for (let t = 0; t <= maxTime; t += windowSize) {
    const damageInWindow = damage
      .filter((d) => d.timestamp >= t - windowSize && d.timestamp < t)
      .reduce((sum, d) => sum + d.amount, 0);

    cumulativeDamage += damageInWindow;

    const dps = t > 0 ? Math.round(cumulativeDamage / t) : 0;

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
