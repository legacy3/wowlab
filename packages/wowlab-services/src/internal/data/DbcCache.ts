import { Map as ImmutableMap } from "immutable";
import { Dbc } from "@wowlab/core/Schemas";

export interface RawDbcData {
  spell: Dbc.SpellRow[];
  spellEffect: Dbc.SpellEffectRow[];
  spellMisc: Dbc.SpellMiscRow[];
  spellName: Dbc.SpellNameRow[];
  spellCastTimes: Dbc.SpellCastTimesRow[];
  spellCooldowns: Dbc.SpellCooldownsRow[];
  spellDuration: Dbc.SpellDurationRow[];
  spellRadius: Dbc.SpellRadiusRow[];
  spellRange: Dbc.SpellRangeRow[];
  spellCategories: Dbc.SpellCategoriesRow[];
  spellCategory: Dbc.SpellCategoryRow[];
  spellPower: Dbc.SpellPowerRow[];
  spellClassOptions: Dbc.SpellClassOptionsRow[];
  item: Dbc.ItemRow[];
  itemEffect: Dbc.ItemEffectRow[];
  itemSparse: Dbc.ItemSparseRow[];
}

export interface DbcCache {
  spell: ImmutableMap<number, Dbc.SpellRow>;
  spellEffect: ImmutableMap<number, Dbc.SpellEffectRow[]>;
  spellMisc: ImmutableMap<number, Dbc.SpellMiscRow>;
  spellName: ImmutableMap<number, Dbc.SpellNameRow>;
  spellCastTimes: ImmutableMap<number, Dbc.SpellCastTimesRow>;
  spellCooldowns: ImmutableMap<number, Dbc.SpellCooldownsRow>;
  spellDuration: ImmutableMap<number, Dbc.SpellDurationRow>;
  spellRadius: ImmutableMap<number, Dbc.SpellRadiusRow>;
  spellRange: ImmutableMap<number, Dbc.SpellRangeRow>;
  spellCategories: ImmutableMap<number, Dbc.SpellCategoriesRow>;
  spellCategory: ImmutableMap<number, Dbc.SpellCategoryRow>;
  spellPower: ImmutableMap<number, Dbc.SpellPowerRow[]>;
  spellClassOptions: ImmutableMap<number, Dbc.SpellClassOptionsRow>;
  item: ImmutableMap<number, Dbc.ItemRow>;
  itemEffect: ImmutableMap<number, Dbc.ItemEffectRow>;
  itemSparse: ImmutableMap<number, Dbc.ItemSparseRow>;
}

export const createCache = (rawData: RawDbcData): DbcCache => ({
  spell: ImmutableMap(rawData.spell.map((row) => [row.ID, row])),
  spellEffect: groupBySpellId(rawData.spellEffect),
  spellMisc: ImmutableMap(rawData.spellMisc.map((row) => [row.SpellID, row])),
  spellName: ImmutableMap(rawData.spellName.map((row) => [row.ID, row])),
  spellCastTimes: ImmutableMap(
    rawData.spellCastTimes.map((row) => [row.ID, row]),
  ),
  spellCooldowns: ImmutableMap(
    rawData.spellCooldowns.map((row) => [row.SpellID, row]),
  ),
  spellDuration: ImmutableMap(
    rawData.spellDuration.map((row) => [row.ID, row]),
  ),
  spellRadius: ImmutableMap(rawData.spellRadius.map((row) => [row.ID, row])),
  spellRange: ImmutableMap(rawData.spellRange.map((row) => [row.ID, row])),
  spellCategories: ImmutableMap(
    rawData.spellCategories.map((row) => [row.SpellID, row]),
  ),
  spellCategory: ImmutableMap(
    rawData.spellCategory.map((row) => [row.ID, row]),
  ),
  spellPower: groupBySpellId(rawData.spellPower),
  spellClassOptions: ImmutableMap(
    rawData.spellClassOptions.map((row) => [row.SpellID, row]),
  ),
  item: ImmutableMap(rawData.item.map((row) => [row.ID, row])),
  itemEffect: ImmutableMap(rawData.itemEffect.map((row) => [row.ID, row])),
  itemSparse: ImmutableMap(rawData.itemSparse.map((row) => [row.ID, row])),
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
