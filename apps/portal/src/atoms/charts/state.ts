"use client";

import { atom } from "jotai";

import { createPersistedOrderAtom } from "../utils";
import { combatDataAtom } from "../timeline";
import {
  transformToDpsChartData,
  transformToResourceChartData,
  transformToAbilityChartData,
  transformToCooldownChartData,
  transformToDetailedChartData,
} from "./transformers";

// Chart data types

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

// Fallback mock data generators (used when no simulation data is available)

function generateMockDpsData(): DpsDataPoint[] {
  const data: DpsDataPoint[] = [];
  const baseDps = 800;

  for (let i = 0; i <= 300; i += 5) {
    const cooldownBonus =
      Math.floor(i / 60) !== Math.floor((i - 5) / 60) ? 400 : 0;
    const variance = Math.random() * 200 - 100;
    const currentDps = baseDps + cooldownBonus + variance;

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

function generateMockResourceData(): ResourceDataPoint[] {
  const data: ResourceDataPoint[] = [];
  let mana = 10000;
  let totalSpent = 0;

  for (let i = 0; i <= 300; i += 5) {
    const regen = 50;
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

function generateMockAbilityData(): AbilityUsageDataPoint[] {
  return [
    { ability: "Kill Command", casts: 45, damage: 125000, fill: "var(--chart-1)" },
    { ability: "Cobra Shot", casts: 38, damage: 89000, fill: "var(--chart-2)" },
    { ability: "Barbed Shot", casts: 28, damage: 67000, fill: "var(--chart-3)" },
    { ability: "Barrage", casts: 12, damage: 42000, fill: "var(--chart-4)" },
    { ability: "Kill Shot", casts: 5, damage: 35000, fill: "var(--chart-5)" },
  ];
}

function generateMockCooldownData(): CooldownEvent[] {
  return [
    { time: 0, ability: "Bestial Wrath", duration: 15 },
    { time: 90, ability: "Bestial Wrath", duration: 15 },
    { time: 180, ability: "Bestial Wrath", duration: 15 },
    { time: 270, ability: "Bestial Wrath", duration: 15 },
    { time: 0, ability: "Call of the Wild", duration: 20 },
    { time: 120, ability: "Call of the Wild", duration: 20 },
    { time: 240, ability: "Call of the Wild", duration: 20 },
    { time: 45, ability: "Bloodshed", duration: 12 },
    { time: 90, ability: "Bloodshed", duration: 12 },
  ];
}

function generateMockDetailedData(): DetailedDataPoint[] {
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

// Derived atoms that read from combatData with fallback to mock data

export const dpsDataAtom = atom<DpsDataPoint[]>((get) => {
  const combatData = get(combatDataAtom);

  // If we have damage data, transform it
  if (combatData && combatData.damage.length > 0) {
    return transformToDpsChartData(combatData);
  }

  // Fallback to mock data
  return generateMockDpsData();
});

export const resourceDataAtom = atom<ResourceDataPoint[]>((get) => {
  const combatData = get(combatDataAtom);

  // If we have resource data, transform it
  if (combatData && combatData.resources.length > 0) {
    return transformToResourceChartData(combatData);
  }

  // Fallback to mock data
  return generateMockResourceData();
});

export const abilityDataAtom = atom<AbilityUsageDataPoint[]>((get) => {
  const combatData = get(combatDataAtom);

  // If we have cast data, transform it
  if (combatData && combatData.casts.length > 0) {
    return transformToAbilityChartData(combatData);
  }

  // Fallback to mock data
  return generateMockAbilityData();
});

export const cooldownDataAtom = atom<CooldownEvent[]>((get) => {
  const combatData = get(combatDataAtom);

  // If we have buff data, transform it
  if (combatData && combatData.buffs.length > 0) {
    return transformToCooldownChartData(combatData);
  }

  // Fallback to mock data
  return generateMockCooldownData();
});

export const detailedDataAtom = atom<DetailedDataPoint[]>((get) => {
  const combatData = get(combatDataAtom);

  // If we have damage data, transform it
  if (combatData && combatData.damage.length > 0) {
    return transformToDetailedChartData(combatData);
  }

  // Fallback to mock data
  return generateMockDetailedData();
});

// Chart order management
export type ChartId = "dps" | "resource" | "ability" | "cooldown" | "detailed";

export const chartsOrderAtom = createPersistedOrderAtom<ChartId>(
  "charts-order-v2",
  ["dps", "resource", "ability", "cooldown", "detailed"],
);
