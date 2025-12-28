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

// Derived atoms that read from combatData with fallback to mock data

export const dpsDataAtom = atom<DpsDataPoint[]>((get) => {
  const combatData = get(combatDataAtom);

  // If we have damage data, transform it
  if (combatData && combatData.damage.length > 0) {
    return transformToDpsChartData(combatData);
  }

  return [];
});

export const resourceDataAtom = atom<ResourceDataPoint[]>((get) => {
  const combatData = get(combatDataAtom);

  // If we have resource data, transform it
  if (combatData && combatData.resources.length > 0) {
    return transformToResourceChartData(combatData);
  }

  return [];
});

export const abilityDataAtom = atom<AbilityUsageDataPoint[]>((get) => {
  const combatData = get(combatDataAtom);

  // If we have cast data, transform it
  if (combatData && combatData.casts.length > 0) {
    return transformToAbilityChartData(combatData);
  }

  return [];
});

export const cooldownDataAtom = atom<CooldownEvent[]>((get) => {
  const combatData = get(combatDataAtom);

  // If we have buff data, transform it
  if (combatData && combatData.buffs.length > 0) {
    return transformToCooldownChartData(combatData);
  }

  return [];
});

export const detailedDataAtom = atom<DetailedDataPoint[]>((get) => {
  const combatData = get(combatDataAtom);

  // If we have damage data, transform it
  if (combatData && combatData.damage.length > 0) {
    return transformToDetailedChartData(combatData);
  }

  return [];
});

// Chart order management
export type ChartId = "dps" | "resource" | "ability" | "cooldown" | "detailed";

export const chartsOrderAtom = createPersistedOrderAtom<ChartId>(
  "charts-order-v2",
  ["dps", "resource", "ability", "cooldown", "detailed"],
);
