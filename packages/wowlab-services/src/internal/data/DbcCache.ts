import { Dbc } from "@wowlab/core/Schemas";
import { Map as ImmutableMap } from "immutable";

// prettier-ignore
export interface DbcCache {
  chrClasses: ImmutableMap<number, Dbc.ChrClassesRow>;
  chrSpecialization: ImmutableMap<number, Dbc.ChrSpecializationRow>;
  contentTuningXExpected: Dbc.ContentTuningXExpectedRow[];
  difficulty: ImmutableMap<number, Dbc.DifficultyRow>;
  expectedStat: Dbc.ExpectedStatRow[];
  expectedStatMod: ImmutableMap<number, Dbc.ExpectedStatModRow>;
  item: ImmutableMap<number, Dbc.ItemRow>;
  itemAppearance: ImmutableMap<number, Dbc.ItemAppearanceRow>;
  itemBonusListGroup: ImmutableMap<number, Dbc.ItemBonusListGroupRow>;
  itemBonusListGroupEntry: ImmutableMap<number, Dbc.ItemBonusListGroupEntryRow[]>;
  itemBonusSeason: ImmutableMap<number, Dbc.ItemBonusSeasonRow>;
  itemBonusSeasonUpgradeCost: ImmutableMap<number, Dbc.ItemBonusSeasonUpgradeCostRow[]>;
  itemClass: ImmutableMap<number, Dbc.ItemClassRow>;
  itemEffect: ImmutableMap<number, Dbc.ItemEffectRow>;
  itemModifiedAppearance: ImmutableMap<number, Dbc.ItemModifiedAppearanceRow>;
  itemNameDescription: ImmutableMap<number, Dbc.ItemNameDescriptionRow>;
  itemSet: ImmutableMap<number, Dbc.ItemSetRow>;
  itemSetSpell: ImmutableMap<number, Dbc.ItemSetSpellRow[]>;
  itemSparse: ImmutableMap<number, Dbc.ItemSparseRow>;
  itemSubClass: ImmutableMap<number, Dbc.ItemSubClassRow>;
  itemXBonusTree: ImmutableMap<number, Dbc.ItemXBonusTreeRow[]>;
  itemXItemEffect: ImmutableMap<number, Dbc.ItemXItemEffectRow[]>;
  journalEncounter: ImmutableMap<number, Dbc.JournalEncounterRow>;
  journalEncounterItem: ImmutableMap<number, Dbc.JournalEncounterItemRow[]>;
  journalEncounterItemByItemId: ImmutableMap<number, Dbc.JournalEncounterItemRow[]>;
  journalInstance: ImmutableMap<number, Dbc.JournalInstanceRow>;
  manifestInterfaceData: ImmutableMap<number, Dbc.ManifestInterfaceDataRow>;
  modifiedCraftingReagentItem: ImmutableMap<number, Dbc.ModifiedCraftingReagentItemRow>;
  specializationSpells: ImmutableMap<number, Dbc.SpecializationSpellsRow[]>;
  spell: ImmutableMap<number, Dbc.SpellRow>;
  spellAuraOptions: ImmutableMap<number, Dbc.SpellAuraOptionsRow>;
  spellAuraRestrictions: ImmutableMap<number, Dbc.SpellAuraRestrictionsRow>;
  spellCastingRequirements: ImmutableMap<number, Dbc.SpellCastingRequirementsRow>;
  spellCastTimes: ImmutableMap<number, Dbc.SpellCastTimesRow>;
  spellCategories: ImmutableMap<number, Dbc.SpellCategoriesRow>;
  spellCategory: ImmutableMap<number, Dbc.SpellCategoryRow>;
  spellClassOptions: ImmutableMap<number, Dbc.SpellClassOptionsRow>;
  spellCooldowns: ImmutableMap<number, Dbc.SpellCooldownsRow>;
  spellDescriptionVariables: ImmutableMap<number, Dbc.SpellDescriptionVariablesRow>;
  spellDuration: ImmutableMap<number, Dbc.SpellDurationRow>;
  spellEffect: ImmutableMap<number, Dbc.SpellEffectRow[]>;
  spellEmpower: ImmutableMap<number, Dbc.SpellEmpowerRow>;
  spellEmpowerStage: ImmutableMap<number, Dbc.SpellEmpowerStageRow[]>;
  spellInterrupts: ImmutableMap<number, Dbc.SpellInterruptsRow>;
  spellLearnSpell: ImmutableMap<number, Dbc.SpellLearnSpellRow[]>;
  spellLevels: ImmutableMap<number, Dbc.SpellLevelsRow[]>;
  spellMisc: ImmutableMap<number, Dbc.SpellMiscRow>;
  spellName: ImmutableMap<number, Dbc.SpellNameRow>;
  spellPower: ImmutableMap<number, Dbc.SpellPowerRow[]>;
  spellProcsPerMinute: ImmutableMap<number, Dbc.SpellProcsPerMinuteRow>;
  spellProcsPerMinuteMod: ImmutableMap<number, Dbc.SpellProcsPerMinuteModRow[]>;
  spellRadius: ImmutableMap<number, Dbc.SpellRadiusRow>;
  spellRange: ImmutableMap<number, Dbc.SpellRangeRow>;
  spellReplacement: ImmutableMap<number, Dbc.SpellReplacementRow>;
  spellShapeshift: ImmutableMap<number, Dbc.SpellShapeshiftRow>;
  spellShapeshiftForm: ImmutableMap<number, Dbc.SpellShapeshiftFormRow>;
  spellTargetRestrictions: ImmutableMap<number, Dbc.SpellTargetRestrictionsRow>;
  spellTotems: ImmutableMap<number, Dbc.SpellTotemsRow[]>;
  spellXDescriptionVariables: ImmutableMap<number, Dbc.SpellXDescriptionVariablesRow[]>;
  traitDefinition: ImmutableMap<number, Dbc.TraitDefinitionRow>;
  traitEdge: ImmutableMap<number, Dbc.TraitEdgeRow[]>; // keyed by TraitTreeID (from LeftTraitNode lookup)
  traitNode: ImmutableMap<number, Dbc.TraitNodeRow>;
  traitNodeEntry: ImmutableMap<number, Dbc.TraitNodeEntryRow>;
  traitNodesByTree: ImmutableMap<number, Dbc.TraitNodeRow[]>; // keyed by TraitTreeID
  traitNodeXTraitNodeEntry: ImmutableMap<number, Dbc.TraitNodeXTraitNodeEntryRow[]>; // keyed by TraitNodeID
  traitSubTree: ImmutableMap<number, Dbc.TraitSubTreeRow>;
  traitTree: ImmutableMap<number, Dbc.TraitTreeRow>;
  traitTreeLoadout: ImmutableMap<number, Dbc.TraitTreeLoadoutRow>; // keyed by ChrSpecializationID
  traitTreeLoadoutEntry: ImmutableMap<number, Dbc.TraitTreeLoadoutEntryRow[]>; // keyed by TraitTreeLoadoutID
  uiTextureAtlasElement: ImmutableMap<number, Dbc.UiTextureAtlasElementRow>;
}

// prettier-ignore
export interface RawDbcData {
  chrClasses: Dbc.ChrClassesRow[];
  chrSpecialization: Dbc.ChrSpecializationRow[];
  contentTuningXExpected: Dbc.ContentTuningXExpectedRow[];
  difficulty: Dbc.DifficultyRow[];
  expectedStat: Dbc.ExpectedStatRow[];
  expectedStatMod: Dbc.ExpectedStatModRow[];
  item: Dbc.ItemRow[];
  itemAppearance: Dbc.ItemAppearanceRow[];
  itemBonusListGroup: Dbc.ItemBonusListGroupRow[];
  itemBonusListGroupEntry: Dbc.ItemBonusListGroupEntryRow[];
  itemBonusSeason: Dbc.ItemBonusSeasonRow[];
  itemBonusSeasonUpgradeCost: Dbc.ItemBonusSeasonUpgradeCostRow[];
  itemClass: Dbc.ItemClassRow[];
  itemEffect: Dbc.ItemEffectRow[];
  itemModifiedAppearance: Dbc.ItemModifiedAppearanceRow[];
  itemNameDescription: Dbc.ItemNameDescriptionRow[];
  itemSet: Dbc.ItemSetRow[];
  itemSetSpell: Dbc.ItemSetSpellRow[];
  itemSparse: Dbc.ItemSparseRow[];
  itemSubClass: Dbc.ItemSubClassRow[];
  itemXBonusTree: Dbc.ItemXBonusTreeRow[];
  itemXItemEffect: Dbc.ItemXItemEffectRow[];
  journalEncounter: Dbc.JournalEncounterRow[];
  journalEncounterItem: Dbc.JournalEncounterItemRow[];
  journalInstance: Dbc.JournalInstanceRow[];
  manifestInterfaceData: Dbc.ManifestInterfaceDataRow[];
  modifiedCraftingReagentItem: Dbc.ModifiedCraftingReagentItemRow[];
  specializationSpells: Dbc.SpecializationSpellsRow[];
  spell: Dbc.SpellRow[];
  spellAuraOptions: Dbc.SpellAuraOptionsRow[];
  spellAuraRestrictions: Dbc.SpellAuraRestrictionsRow[];
  spellCastingRequirements: Dbc.SpellCastingRequirementsRow[];
  spellCastTimes: Dbc.SpellCastTimesRow[];
  spellCategories: Dbc.SpellCategoriesRow[];
  spellCategory: Dbc.SpellCategoryRow[];
  spellClassOptions: Dbc.SpellClassOptionsRow[];
  spellCooldowns: Dbc.SpellCooldownsRow[];
  spellDescriptionVariables: Dbc.SpellDescriptionVariablesRow[];
  spellDuration: Dbc.SpellDurationRow[];
  spellEffect: Dbc.SpellEffectRow[];
  spellEmpower: Dbc.SpellEmpowerRow[];
  spellEmpowerStage: Dbc.SpellEmpowerStageRow[];
  spellInterrupts: Dbc.SpellInterruptsRow[];
  spellLearnSpell: Dbc.SpellLearnSpellRow[];
  spellLevels: Dbc.SpellLevelsRow[];
  spellMisc: Dbc.SpellMiscRow[];
  spellName: Dbc.SpellNameRow[];
  spellPower: Dbc.SpellPowerRow[];
  spellProcsPerMinute: Dbc.SpellProcsPerMinuteRow[];
  spellProcsPerMinuteMod: Dbc.SpellProcsPerMinuteModRow[];
  spellRadius: Dbc.SpellRadiusRow[];
  spellRange: Dbc.SpellRangeRow[];
  spellReplacement: Dbc.SpellReplacementRow[];
  spellShapeshift: Dbc.SpellShapeshiftRow[];
  spellShapeshiftForm: Dbc.SpellShapeshiftFormRow[];
  spellTargetRestrictions: Dbc.SpellTargetRestrictionsRow[];
  spellTotems: Dbc.SpellTotemsRow[];
  spellXDescriptionVariables: Dbc.SpellXDescriptionVariablesRow[];
  traitDefinition: Dbc.TraitDefinitionRow[];
  traitEdge: Dbc.TraitEdgeRow[];
  traitNode: Dbc.TraitNodeRow[];
  traitNodeEntry: Dbc.TraitNodeEntryRow[];
  traitNodeXTraitNodeEntry: Dbc.TraitNodeXTraitNodeEntryRow[];
  traitSubTree: Dbc.TraitSubTreeRow[];
  traitTree: Dbc.TraitTreeRow[];
  traitTreeLoadout: Dbc.TraitTreeLoadoutRow[];
  traitTreeLoadoutEntry: Dbc.TraitTreeLoadoutEntryRow[];
  uiTextureAtlasElement: Dbc.UiTextureAtlasElementRow[];
}

// prettier-ignore
export const createCache = (rawData: RawDbcData): DbcCache => ({
  chrClasses: ImmutableMap(rawData.chrClasses.map((row) => [row.ID, row])),
  chrSpecialization: ImmutableMap(rawData.chrSpecialization.map((row) => [row.ID, row])),
  contentTuningXExpected: rawData.contentTuningXExpected,
  difficulty: ImmutableMap(rawData.difficulty.map((row) => [row.ID, row])),
  expectedStat: rawData.expectedStat,
  expectedStatMod: ImmutableMap(rawData.expectedStatMod.map((row) => [row.ID, row])),
  item: ImmutableMap(rawData.item.map((row) => [row.ID, row])),
  itemAppearance: ImmutableMap(rawData.itemAppearance.map((row) => [row.ID, row])),
  itemBonusListGroup: ImmutableMap(rawData.itemBonusListGroup.map((row) => [row.ID, row])),
  itemBonusListGroupEntry: groupByItemBonusListGroupId(rawData.itemBonusListGroupEntry),
  itemBonusSeason: ImmutableMap(rawData.itemBonusSeason.map((row) => [row.ID, row])),
  itemBonusSeasonUpgradeCost: groupByItemBonusSeasonId(rawData.itemBonusSeasonUpgradeCost),
  itemClass: ImmutableMap(rawData.itemClass.map((row) => [row.ID, row])),
  itemEffect: ImmutableMap(rawData.itemEffect.map((row) => [row.ID, row])),
  itemModifiedAppearance: ImmutableMap(rawData.itemModifiedAppearance.map((row) => [row.ItemID, row])),
  itemNameDescription: ImmutableMap(rawData.itemNameDescription.map((row) => [row.ID, row])),
  itemSet: ImmutableMap(rawData.itemSet.map((row) => [row.ID, row])),
  itemSetSpell: groupByItemSetId(rawData.itemSetSpell),
  itemSparse: ImmutableMap(rawData.itemSparse.map((row) => [row.ID, row])),
  itemSubClass: ImmutableMap(rawData.itemSubClass.map((row) => [row.ID, row])),
  itemXBonusTree: groupByItemId(rawData.itemXBonusTree),
  itemXItemEffect: groupByItemId(rawData.itemXItemEffect),
  journalEncounter: ImmutableMap(rawData.journalEncounter.map((row) => [row.ID, row])),
  journalEncounterItem: groupByJournalEncounterId(rawData.journalEncounterItem),
  journalEncounterItemByItemId: groupByItemId(rawData.journalEncounterItem),
  journalInstance: ImmutableMap(rawData.journalInstance.map((row) => [row.ID, row])),
  manifestInterfaceData: ImmutableMap(rawData.manifestInterfaceData.map((row) => [row.ID, row])),
  modifiedCraftingReagentItem: ImmutableMap(rawData.modifiedCraftingReagentItem.map((row) => [row.ID, row])),
  specializationSpells: groupBySpecId(rawData.specializationSpells),
  spell: ImmutableMap(rawData.spell.map((row) => [row.ID, row])),
  spellAuraOptions: ImmutableMap(rawData.spellAuraOptions.map((row) => [row.SpellID, row])),
  spellAuraRestrictions: ImmutableMap(rawData.spellAuraRestrictions.map((row) => [row.SpellID, row])),
  spellCastingRequirements: ImmutableMap(rawData.spellCastingRequirements.map((row) => [row.SpellID, row])),
  spellCastTimes: ImmutableMap(rawData.spellCastTimes.map((row) => [row.ID, row])),
  spellCategories: ImmutableMap(rawData.spellCategories.map((row) => [row.SpellID, row])),
  spellCategory: ImmutableMap(rawData.spellCategory.map((row) => [row.ID, row])),
  spellClassOptions: ImmutableMap(rawData.spellClassOptions.map((row) => [row.SpellID, row])),
  spellCooldowns: ImmutableMap(rawData.spellCooldowns.map((row) => [row.SpellID, row])),
  spellDescriptionVariables: ImmutableMap(rawData.spellDescriptionVariables.map((row) => [row.ID, row])),
  spellDuration: ImmutableMap(rawData.spellDuration.map((row) => [row.ID, row])),
  spellEffect: groupBySpellId(rawData.spellEffect),
  spellEmpower: ImmutableMap(rawData.spellEmpower.map((row) => [row.SpellID, row])),
  spellEmpowerStage: groupBySpellEmpowerId(rawData.spellEmpowerStage),
  spellInterrupts: ImmutableMap(rawData.spellInterrupts.map((row) => [row.SpellID, row])),
  spellLearnSpell: groupBySpellId(rawData.spellLearnSpell),
  spellLevels: groupBySpellId(rawData.spellLevels),
  spellMisc: ImmutableMap(rawData.spellMisc.map((row) => [row.SpellID, row])),
  spellName: ImmutableMap(rawData.spellName.map((row) => [row.ID, row])),
  spellPower: groupBySpellId(rawData.spellPower),
  spellProcsPerMinute: ImmutableMap(rawData.spellProcsPerMinute.map((row) => [row.ID, row])),
  spellProcsPerMinuteMod: groupBySpellProcsPerMinuteId(rawData.spellProcsPerMinuteMod),
  spellRadius: ImmutableMap(rawData.spellRadius.map((row) => [row.ID, row])),
  spellRange: ImmutableMap(rawData.spellRange.map((row) => [row.ID, row])),
  spellReplacement: ImmutableMap(rawData.spellReplacement.map((row) => [row.SpellID, row])),
  spellShapeshift: ImmutableMap(rawData.spellShapeshift.map((row) => [row.SpellID, row])),
  spellShapeshiftForm: ImmutableMap(rawData.spellShapeshiftForm.map((row) => [row.ID, row])),
  spellTargetRestrictions: ImmutableMap(rawData.spellTargetRestrictions.map((row) => [row.SpellID, row])),
  spellTotems: groupBySpellId(rawData.spellTotems),
  spellXDescriptionVariables: groupBySpellId(rawData.spellXDescriptionVariables),
  traitDefinition: ImmutableMap(rawData.traitDefinition.map((row) => [row.ID, row])),
  traitEdge: groupTraitEdgesByTreeId(rawData.traitEdge, rawData.traitNode),
  traitNode: ImmutableMap(rawData.traitNode.map((row) => [row.ID, row])),
  traitNodeEntry: ImmutableMap(rawData.traitNodeEntry.map((row) => [row.ID, row])),
  traitNodesByTree: groupByTraitTreeId(rawData.traitNode),
  traitNodeXTraitNodeEntry: groupByTraitNodeId(rawData.traitNodeXTraitNodeEntry),
  traitSubTree: ImmutableMap(rawData.traitSubTree.map((row) => [row.ID, row])),
  traitTree: ImmutableMap(rawData.traitTree.map((row) => [row.ID, row])),
  traitTreeLoadout: ImmutableMap(rawData.traitTreeLoadout.map((row) => [row.ChrSpecializationID, row])),
  traitTreeLoadoutEntry: groupByTraitTreeLoadoutId(rawData.traitTreeLoadoutEntry),
  uiTextureAtlasElement: ImmutableMap(rawData.uiTextureAtlasElement.map((row) => [row.ID, row])),
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

const groupBySpecId = <T extends { SpecID: number }>(
  rows: T[],
): ImmutableMap<number, T[]> => {
  const grouped = new Map<number, T[]>();

  rows.forEach((row) => {
    const existing = grouped.get(row.SpecID) || [];
    grouped.set(row.SpecID, [...existing, row]);
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

const groupByTraitTreeId = <T extends { TraitTreeID: number }>(
  rows: T[],
): ImmutableMap<number, T[]> => {
  const grouped = new Map<number, T[]>();

  rows.forEach((row) => {
    const existing = grouped.get(row.TraitTreeID) || [];
    grouped.set(row.TraitTreeID, [...existing, row]);
  });

  return ImmutableMap(grouped);
};

const groupByTraitNodeId = <T extends { TraitNodeID: number }>(
  rows: T[],
): ImmutableMap<number, T[]> => {
  const grouped = new Map<number, T[]>();

  rows.forEach((row) => {
    const existing = grouped.get(row.TraitNodeID) || [];
    grouped.set(row.TraitNodeID, [...existing, row]);
  });

  return ImmutableMap(grouped);
};

const groupByTraitTreeLoadoutId = <T extends { TraitTreeLoadoutID: number }>(
  rows: T[],
): ImmutableMap<number, T[]> => {
  const grouped = new Map<number, T[]>();

  rows.forEach((row) => {
    const existing = grouped.get(row.TraitTreeLoadoutID) || [];
    grouped.set(row.TraitTreeLoadoutID, [...existing, row]);
  });

  return ImmutableMap(grouped);
};

const groupTraitEdgesByTreeId = (
  edges: Dbc.TraitEdgeRow[],
  nodes: Dbc.TraitNodeRow[],
): ImmutableMap<number, Dbc.TraitEdgeRow[]> => {
  // Build a map of nodeId -> treeId
  const nodeToTree = new Map<number, number>();
  nodes.forEach((node) => {
    nodeToTree.set(node.ID, node.TraitTreeID);
  });

  // Group edges by the tree of their left node
  const grouped = new Map<number, Dbc.TraitEdgeRow[]>();
  edges.forEach((edge) => {
    const treeId = nodeToTree.get(edge.LeftTraitNodeID);

    if (treeId !== undefined) {
      const existing = grouped.get(treeId) || [];
      grouped.set(treeId, [...existing, edge]);
    }
  });

  return ImmutableMap(grouped);
};

const groupByItemBonusListGroupId = <
  T extends { ItemBonusListGroupID: number },
>(
  rows: T[],
): ImmutableMap<number, T[]> => {
  const grouped = new Map<number, T[]>();

  rows.forEach((row) => {
    const existing = grouped.get(row.ItemBonusListGroupID) || [];
    grouped.set(row.ItemBonusListGroupID, [...existing, row]);
  });

  return ImmutableMap(grouped);
};

const groupByItemBonusSeasonId = <T extends { ItemBonusSeasonID: number }>(
  rows: T[],
): ImmutableMap<number, T[]> => {
  const grouped = new Map<number, T[]>();

  rows.forEach((row) => {
    const existing = grouped.get(row.ItemBonusSeasonID) || [];
    grouped.set(row.ItemBonusSeasonID, [...existing, row]);
  });

  return ImmutableMap(grouped);
};

const groupByJournalEncounterId = <T extends { JournalEncounterID: number }>(
  rows: T[],
): ImmutableMap<number, T[]> => {
  const grouped = new Map<number, T[]>();

  rows.forEach((row) => {
    const existing = grouped.get(row.JournalEncounterID) || [];
    grouped.set(row.JournalEncounterID, [...existing, row]);
  });

  return ImmutableMap(grouped);
};

const groupByItemSetId = <T extends { ItemSetID: number }>(
  rows: T[],
): ImmutableMap<number, T[]> => {
  const grouped = new Map<number, T[]>();

  rows.forEach((row) => {
    const existing = grouped.get(row.ItemSetID) || [];
    grouped.set(row.ItemSetID, [...existing, row]);
  });

  return ImmutableMap(grouped);
};
