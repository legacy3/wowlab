import { Dbc } from "@wowlab/core/Schemas";
import { Map as ImmutableMap } from "immutable";

export interface DbcCache {
  difficulty: ImmutableMap<number, Dbc.DifficultyRow>;
  item: ImmutableMap<number, Dbc.ItemRow>;
  itemEffect: ImmutableMap<number, Dbc.ItemEffectRow>;
  itemSparse: ImmutableMap<number, Dbc.ItemSparseRow>;
  itemXItemEffect: ImmutableMap<number, Dbc.ItemXItemEffectRow[]>;
  manifestInterfaceData: ImmutableMap<number, Dbc.ManifestInterfaceDataRow>;
  spell: ImmutableMap<number, Dbc.SpellRow>;
  spellCastTimes: ImmutableMap<number, Dbc.SpellCastTimesRow>;
  spellCategories: ImmutableMap<number, Dbc.SpellCategoriesRow>;
  spellCategory: ImmutableMap<number, Dbc.SpellCategoryRow>;
  spellClassOptions: ImmutableMap<number, Dbc.SpellClassOptionsRow>;
  spellCooldowns: ImmutableMap<number, Dbc.SpellCooldownsRow>;
  spellDuration: ImmutableMap<number, Dbc.SpellDurationRow>;
  spellEffect: ImmutableMap<number, Dbc.SpellEffectRow[]>;
  spellMisc: ImmutableMap<number, Dbc.SpellMiscRow>;
  spellName: ImmutableMap<number, Dbc.SpellNameRow>;
  spellPower: ImmutableMap<number, Dbc.SpellPowerRow[]>;
  spellRadius: ImmutableMap<number, Dbc.SpellRadiusRow>;
  spellRange: ImmutableMap<number, Dbc.SpellRangeRow>;
}

export interface RawDbcData {
  difficulty: Dbc.DifficultyRow[];
  item: Dbc.ItemRow[];
  itemEffect: Dbc.ItemEffectRow[];
  itemSparse: Dbc.ItemSparseRow[];
  itemXItemEffect: Dbc.ItemXItemEffectRow[];
  manifestInterfaceData: Dbc.ManifestInterfaceDataRow[];
  spell: Dbc.SpellRow[];
  spellCastTimes: Dbc.SpellCastTimesRow[];
  spellCategories: Dbc.SpellCategoriesRow[];
  spellCategory: Dbc.SpellCategoryRow[];
  spellClassOptions: Dbc.SpellClassOptionsRow[];
  spellCooldowns: Dbc.SpellCooldownsRow[];
  spellDuration: Dbc.SpellDurationRow[];
  spellEffect: Dbc.SpellEffectRow[];
  spellMisc: Dbc.SpellMiscRow[];
  spellName: Dbc.SpellNameRow[];
  spellPower: Dbc.SpellPowerRow[];
  spellRadius: Dbc.SpellRadiusRow[];
  spellRange: Dbc.SpellRangeRow[];
}

export const createCache = (rawData: RawDbcData): DbcCache => ({
  difficulty: ImmutableMap(rawData.difficulty.map((row) => [row.ID, row])),
  item: ImmutableMap(rawData.item.map((row) => [row.ID, row])),
  itemEffect: ImmutableMap(rawData.itemEffect.map((row) => [row.ID, row])),
  itemSparse: ImmutableMap(rawData.itemSparse.map((row) => [row.ID, row])),
  itemXItemEffect: groupByItemId(rawData.itemXItemEffect),
  manifestInterfaceData: ImmutableMap(
    rawData.manifestInterfaceData.map((row) => [row.ID, row]),
  ),
  spell: ImmutableMap(rawData.spell.map((row) => [row.ID, row])),
  spellCastTimes: ImmutableMap(
    rawData.spellCastTimes.map((row) => [row.ID, row]),
  ),
  spellCategories: ImmutableMap(
    rawData.spellCategories.map((row) => [row.SpellID, row]),
  ),
  spellCategory: ImmutableMap(
    rawData.spellCategory.map((row) => [row.ID, row]),
  ),
  spellClassOptions: ImmutableMap(
    rawData.spellClassOptions.map((row) => [row.SpellID, row]),
  ),
  spellCooldowns: ImmutableMap(
    rawData.spellCooldowns.map((row) => [row.SpellID, row]),
  ),
  spellDuration: ImmutableMap(
    rawData.spellDuration.map((row) => [row.ID, row]),
  ),
  spellEffect: groupBySpellId(rawData.spellEffect),
  spellMisc: ImmutableMap(rawData.spellMisc.map((row) => [row.SpellID, row])),
  spellName: ImmutableMap(rawData.spellName.map((row) => [row.ID, row])),
  spellPower: groupBySpellId(rawData.spellPower),
  spellRadius: ImmutableMap(rawData.spellRadius.map((row) => [row.ID, row])),
  spellRange: ImmutableMap(rawData.spellRange.map((row) => [row.ID, row])),
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
