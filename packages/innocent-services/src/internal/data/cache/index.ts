import { Map } from "immutable";

import type { RawDBCData, SpellInfoCache } from "../types";

const index = <T extends { SpellID?: number; ID?: number }>(
  rows: T[],
  key: "SpellID" | "ID",
): Map<number, T[]> => {
  let result = Map<number, T[]>();

  for (const row of rows) {
    const id = row[key];
    if (id !== undefined) {
      const existing = result.get(id) ?? [];
      result = result.set(id, [...existing, row]);
    }
  }

  return result;
};

const indexSingle = <T extends { SpellID?: number; ID?: number }>(
  rows: T[],
  key: "SpellID" | "ID",
): Map<number, T> => {
  let result = Map<number, T>();

  for (const row of rows) {
    const id = row[key];
    if (id !== undefined) {
      result = result.set(id, row);
    }
  }

  return result;
};

export const createCache = (data: RawDBCData): SpellInfoCache => ({
  fileData: indexSingle(data.fileData, "ID"),
  spellCastingRequirements: index(data.spellCastingRequirements, "SpellID"),
  spellCastTimes: index(data.spellCastTimes, "ID"),
  spellCategories: index(data.spellCategories, "SpellID"),
  spellCategory: index(data.spellCategory, "ID"),
  spellCooldowns: index(data.spellCooldowns, "SpellID"),
  spellDuration: index(data.spellDuration, "ID"),
  spellEffect: index(data.spellEffect, "SpellID"),
  spellEmpower: index(data.spellEmpower, "SpellID"),
  spellEmpowerStage: index(data.spellEmpowerStage, "ID"),
  spellInterrupts: index(data.spellInterrupts, "SpellID"),
  spellMisc: index(data.spellMisc, "SpellID"),
  spellName: indexSingle(data.spellName, "ID"),
  spellRadius: index(data.spellRadius, "ID"),
  spellRange: index(data.spellRange, "ID"),
  spellTargetRestrictions: index(data.spellTargetRestrictions, "SpellID"),
});
