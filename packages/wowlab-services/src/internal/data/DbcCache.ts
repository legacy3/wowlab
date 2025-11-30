import { Dbc } from "@wowlab/core/Schemas";
import { Map as ImmutableMap } from "immutable";

export interface DbcCache {
  contentTuningXExpected: Dbc.ContentTuningXExpectedRow[];
  difficulty: ImmutableMap<number, Dbc.DifficultyRow>;
  expectedStat: Dbc.ExpectedStatRow[];
  expectedStatMod: ImmutableMap<number, Dbc.ExpectedStatModRow>;
  item: ImmutableMap<number, Dbc.ItemRow>;
  itemEffect: ImmutableMap<number, Dbc.ItemEffectRow>;
  itemSparse: ImmutableMap<number, Dbc.ItemSparseRow>;
  itemXItemEffect: ImmutableMap<number, Dbc.ItemXItemEffectRow[]>;
  manifestInterfaceData: ImmutableMap<number, Dbc.ManifestInterfaceDataRow>;
  spell: ImmutableMap<number, Dbc.SpellRow>;
  spellAuraOptions: ImmutableMap<number, Dbc.SpellAuraOptionsRow>;
  spellCastingRequirements: ImmutableMap<
    number,
    Dbc.SpellCastingRequirementsRow
  >;
  spellCastTimes: ImmutableMap<number, Dbc.SpellCastTimesRow>;
  spellCategories: ImmutableMap<number, Dbc.SpellCategoriesRow>;
  spellCategory: ImmutableMap<number, Dbc.SpellCategoryRow>;
  spellClassOptions: ImmutableMap<number, Dbc.SpellClassOptionsRow>;
  spellCooldowns: ImmutableMap<number, Dbc.SpellCooldownsRow>;
  spellDuration: ImmutableMap<number, Dbc.SpellDurationRow>;
  spellEffect: ImmutableMap<number, Dbc.SpellEffectRow[]>;
  spellEmpower: ImmutableMap<number, Dbc.SpellEmpowerRow>;
  spellEmpowerStage: ImmutableMap<number, Dbc.SpellEmpowerStageRow[]>;
  spellInterrupts: ImmutableMap<number, Dbc.SpellInterruptsRow>;
  spellMisc: ImmutableMap<number, Dbc.SpellMiscRow>;
  spellName: ImmutableMap<number, Dbc.SpellNameRow>;
  spellPower: ImmutableMap<number, Dbc.SpellPowerRow[]>;
  spellProcsPerMinute: ImmutableMap<number, Dbc.SpellProcsPerMinuteRow>;
  spellProcsPerMinuteMod: ImmutableMap<number, Dbc.SpellProcsPerMinuteModRow[]>;
  spellRadius: ImmutableMap<number, Dbc.SpellRadiusRow>;
  spellRange: ImmutableMap<number, Dbc.SpellRangeRow>;
  spellTargetRestrictions: ImmutableMap<number, Dbc.SpellTargetRestrictionsRow>;
}

export interface RawDbcData {
  contentTuningXExpected: Dbc.ContentTuningXExpectedRow[];
  difficulty: Dbc.DifficultyRow[];
  expectedStat: Dbc.ExpectedStatRow[];
  expectedStatMod: Dbc.ExpectedStatModRow[];
  item: Dbc.ItemRow[];
  itemEffect: Dbc.ItemEffectRow[];
  itemSparse: Dbc.ItemSparseRow[];
  itemXItemEffect: Dbc.ItemXItemEffectRow[];
  manifestInterfaceData: Dbc.ManifestInterfaceDataRow[];
  spell: Dbc.SpellRow[];
  spellAuraOptions: Dbc.SpellAuraOptionsRow[];
  spellCastingRequirements: Dbc.SpellCastingRequirementsRow[];
  spellCastTimes: Dbc.SpellCastTimesRow[];
  spellCategories: Dbc.SpellCategoriesRow[];
  spellCategory: Dbc.SpellCategoryRow[];
  spellClassOptions: Dbc.SpellClassOptionsRow[];
  spellCooldowns: Dbc.SpellCooldownsRow[];
  spellDuration: Dbc.SpellDurationRow[];
  spellEffect: Dbc.SpellEffectRow[];
  spellEmpower: Dbc.SpellEmpowerRow[];
  spellEmpowerStage: Dbc.SpellEmpowerStageRow[];
  spellInterrupts: Dbc.SpellInterruptsRow[];
  spellMisc: Dbc.SpellMiscRow[];
  spellName: Dbc.SpellNameRow[];
  spellPower: Dbc.SpellPowerRow[];
  spellProcsPerMinute: Dbc.SpellProcsPerMinuteRow[];
  spellProcsPerMinuteMod: Dbc.SpellProcsPerMinuteModRow[];
  spellRadius: Dbc.SpellRadiusRow[];
  spellRange: Dbc.SpellRangeRow[];
  spellTargetRestrictions: Dbc.SpellTargetRestrictionsRow[];
}

// prettier-ignore
export const createCache = (rawData: RawDbcData): DbcCache => ({
  contentTuningXExpected: rawData.contentTuningXExpected,
  difficulty: ImmutableMap(rawData.difficulty.map((row) => [row.ID, row])),
  expectedStat: rawData.expectedStat,
  expectedStatMod: ImmutableMap(rawData.expectedStatMod.map((row) => [row.ID, row])),
  item: ImmutableMap(rawData.item.map((row) => [row.ID, row])),
  itemEffect: ImmutableMap(rawData.itemEffect.map((row) => [row.ID, row])),
  itemSparse: ImmutableMap(rawData.itemSparse.map((row) => [row.ID, row])),
  itemXItemEffect: groupByItemId(rawData.itemXItemEffect),
  manifestInterfaceData: ImmutableMap(rawData.manifestInterfaceData.map((row) => [row.ID, row])),
  spell: ImmutableMap(rawData.spell.map((row) => [row.ID, row])),
  spellAuraOptions: ImmutableMap(rawData.spellAuraOptions.map((row) => [row.SpellID, row])),
  spellCastingRequirements: ImmutableMap(rawData.spellCastingRequirements.map((row) => [row.SpellID, row])),
  spellCastTimes: ImmutableMap(rawData.spellCastTimes.map((row) => [row.ID, row])),
  spellCategories: ImmutableMap(rawData.spellCategories.map((row) => [row.SpellID, row])),
  spellCategory: ImmutableMap(rawData.spellCategory.map((row) => [row.ID, row])),
  spellClassOptions: ImmutableMap(rawData.spellClassOptions.map((row) => [row.SpellID, row])),
  spellCooldowns: ImmutableMap(rawData.spellCooldowns.map((row) => [row.SpellID, row])),
  spellDuration: ImmutableMap(rawData.spellDuration.map((row) => [row.ID, row])),
  spellEffect: groupBySpellId(rawData.spellEffect),
  spellEmpower: ImmutableMap(rawData.spellEmpower.map((row) => [row.SpellID, row])),
  spellEmpowerStage: groupBySpellEmpowerId(rawData.spellEmpowerStage),
  spellInterrupts: ImmutableMap(rawData.spellInterrupts.map((row) => [row.SpellID, row])),
  spellMisc: ImmutableMap(rawData.spellMisc.map((row) => [row.SpellID, row])),
  spellName: ImmutableMap(rawData.spellName.map((row) => [row.ID, row])),
  spellPower: groupBySpellId(rawData.spellPower),
  spellProcsPerMinute: ImmutableMap(rawData.spellProcsPerMinute.map((row) => [row.ID, row])),
  spellProcsPerMinuteMod: groupBySpellProcsPerMinuteId(rawData.spellProcsPerMinuteMod),
  spellRadius: ImmutableMap(rawData.spellRadius.map((row) => [row.ID, row])),
  spellRange: ImmutableMap(rawData.spellRange.map((row) => [row.ID, row])),
  spellTargetRestrictions: ImmutableMap(rawData.spellTargetRestrictions.map((row) => [row.SpellID, row])),
});

const groupBySpellId = <T extends { SpellID: number }>(
  rows: T[],
): ImmutableMap<number, T[]> => {
  const grouped = new Map<number, T[]>();

  rows.forEach((row) => {
    const existing = grouped.get(row.SpellID) || [];
    grouped.set(row.SpellID, [...existing, row]);
  });

  return ImmutableMap(grouped);
};

const groupByItemId = <T extends { ItemID: number }>(
  rows: T[],
): ImmutableMap<number, T[]> => {
  const grouped = new Map<number, T[]>();

  rows.forEach((row) => {
    const existing = grouped.get(row.ItemID) || [];
    grouped.set(row.ItemID, [...existing, row]);
  });

  return ImmutableMap(grouped);
};

const groupBySpellEmpowerId = <T extends { SpellEmpowerID: number }>(
  rows: T[],
): ImmutableMap<number, T[]> => {
  const grouped = new Map<number, T[]>();

  rows.forEach((row) => {
    const existing = grouped.get(row.SpellEmpowerID) || [];
    grouped.set(row.SpellEmpowerID, [...existing, row]);
  });

  return ImmutableMap(grouped);
};

const groupBySpellProcsPerMinuteId = <
  T extends { SpellProcsPerMinuteID: number },
>(
  rows: T[],
): ImmutableMap<number, T[]> => {
  const grouped = new Map<number, T[]>();

  rows.forEach((row) => {
    const existing = grouped.get(row.SpellProcsPerMinuteID) || [];
    grouped.set(row.SpellProcsPerMinuteID, [...existing, row]);
  });

  return ImmutableMap(grouped);
};
