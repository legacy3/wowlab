"use client";

import { atom } from "jotai";

import { createPersistedOrderAtom } from "../utils";

// Mock data generators for simulation analytics

export interface DpsDataPoint {
  time: number;
  dps: number;
  running_avg: number;
}

export interface ResourceDataPoint {
  time: number;
  mana: number;
  mana_spent: number;
}

export interface AbilityUsageDataPoint {
  ability: string;
  casts: number;
  damage: number;
  fill: string;
}

export interface CooldownEvent {
  time: number;
  ability: string;
  duration: number;
}

export interface DetailedDataPoint {
  time: number;
  damage: number;
  mana: number;
  dps: number;
}

// Generate mock DPS data (simulating a rotation over 300 seconds)
function generateDpsData(): DpsDataPoint[] {
  const data: DpsDataPoint[] = [];
  const baseDps = 800;

  for (let i = 0; i <= 300; i += 5) {
    // Simulate cooldown spikes every ~60 seconds
    const cooldownBonus =
      Math.floor(i / 60) !== Math.floor((i - 5) / 60) ? 400 : 0;
    // Add some variance
    const variance = Math.random() * 200 - 100;
    const currentDps = baseDps + cooldownBonus + variance;

    // Running average (smoothed)
    const runningAvg =
      data.length > 0
        ? data[data.length - 1].running_avg * 0.8 + currentDps * 0.2
        : currentDps;

    data.push({
      time: i,
      dps: Math.round(currentDps),
      running_avg: Math.round(runningAvg),
    });
  }

  return data;
}

// Generate mock resource (mana) data
function generateResourceData(): ResourceDataPoint[] {
  const data: ResourceDataPoint[] = [];
  let mana = 10000;
  let totalSpent = 0;

  for (let i = 0; i <= 300; i += 5) {
    // Mana regeneration
    const regen = 50;
    // Mana spending (spiky with ability usage)
    const spent =
      Math.random() > 0.7
        ? Math.floor(Math.random() * 500)
        : Math.floor(Math.random() * 200);

    mana = Math.max(0, Math.min(10000, mana + regen - spent));
    totalSpent += spent;

    data.push({
      time: i,
      mana: Math.round(mana),
      mana_spent: totalSpent,
    });
  }

  return data;
}

// Generate mock ability usage data
function generateAbilityData(): AbilityUsageDataPoint[] {
  return [
    { ability: "Fireball", casts: 45, damage: 125000, fill: "var(--chart-1)" },
    { ability: "Pyroblast", casts: 12, damage: 89000, fill: "var(--chart-2)" },
    { ability: "Fire Blast", casts: 38, damage: 67000, fill: "var(--chart-3)" },
    { ability: "Scorch", casts: 28, damage: 42000, fill: "var(--chart-4)" },
    { ability: "Combustion", casts: 5, damage: 35000, fill: "var(--chart-5)" },
  ];
}

// Generate mock cooldown events
function generateCooldownData(): CooldownEvent[] {
  return [
    { time: 0, ability: "Combustion", duration: 10 },
    { time: 60, ability: "Combustion", duration: 10 },
    { time: 120, ability: "Combustion", duration: 10 },
    { time: 180, ability: "Combustion", duration: 10 },
    { time: 240, ability: "Combustion", duration: 10 },
    { time: 30, ability: "Icy Veins", duration: 20 },
    { time: 150, ability: "Icy Veins", duration: 20 },
    { time: 90, ability: "Presence of Mind", duration: 15 },
    { time: 210, ability: "Presence of Mind", duration: 15 },
  ];
}

// Generate detailed breakdown data
function generateDetailedData(): DetailedDataPoint[] {
  const data: DetailedDataPoint[] = [];
  let cumulativeDamage = 0;

  for (let i = 0; i <= 300; i += 10) {
    const damage = Math.floor(Math.random() * 5000 + 8000);
    cumulativeDamage += damage;
    const dps = cumulativeDamage / Math.max(1, i);
    const mana = 10000 - (i / 300) * 8000 + Math.random() * 1000;

    data.push({
      time: i,
      damage: Math.round(cumulativeDamage),
      mana: Math.round(Math.max(0, mana)),
      dps: Math.round(dps),
    });
  }

  return data;
}

// Atoms for chart data
export const dpsDataAtom = atom<DpsDataPoint[]>(generateDpsData());

export const resourceDataAtom = atom<ResourceDataPoint[]>(
  generateResourceData(),
);

export const abilityDataAtom = atom<AbilityUsageDataPoint[]>(
  generateAbilityData(),
);

export const cooldownDataAtom = atom<CooldownEvent[]>(generateCooldownData());

export const detailedDataAtom = atom<DetailedDataPoint[]>(
  generateDetailedData(),
);

// Chart order management
export type ChartId = "dps" | "resource" | "ability" | "cooldown" | "detailed";

export const chartsOrderAtom = createPersistedOrderAtom<ChartId>(
  "charts-order-v2",
  ["dps", "resource", "ability", "cooldown", "detailed"],
);
