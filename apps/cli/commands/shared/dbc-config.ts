import { Dbc } from "@wowlab/core/Schemas";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DBC_DATA_DIR = path.join(
  __dirname,
  "../../../../third_party/wowlab-data/data/tables",
);

// prettier-ignore
export const SPELL_TABLES = {
  manifestInterfaceData: { file: "ManifestInterfaceData.csv", schema: Dbc.ManifestInterfaceDataRowSchema },
  spell: { file: "Spell.csv", schema: Dbc.SpellRowSchema },
  spellAuraOptions: { file: "SpellAuraOptions.csv", schema: Dbc.SpellAuraOptionsRowSchema },
  spellCastingRequirements: { file: "SpellCastingRequirements.csv", schema: Dbc.SpellCastingRequirementsRowSchema },
  spellCastTimes: { file: "SpellCastTimes.csv", schema: Dbc.SpellCastTimesRowSchema },
  spellCategories: { file: "SpellCategories.csv", schema: Dbc.SpellCategoriesRowSchema },
  spellCategory: { file: "SpellCategory.csv", schema: Dbc.SpellCategoryRowSchema },
  spellClassOptions: { file: "SpellClassOptions.csv", schema: Dbc.SpellClassOptionsRowSchema },
  spellCooldowns: { file: "SpellCooldowns.csv", schema: Dbc.SpellCooldownsRowSchema },
  spellDuration: { file: "SpellDuration.csv", schema: Dbc.SpellDurationRowSchema },
  spellEffect: { file: "SpellEffect.csv", schema: Dbc.SpellEffectRowSchema },
  spellEmpower: { file: "SpellEmpower.csv", schema: Dbc.SpellEmpowerRowSchema },
  spellEmpowerStage: { file: "SpellEmpowerStage.csv", schema: Dbc.SpellEmpowerStageRowSchema },
  spellInterrupts: { file: "SpellInterrupts.csv", schema: Dbc.SpellInterruptsRowSchema },
  spellMisc: { file: "SpellMisc.csv", schema: Dbc.SpellMiscRowSchema },
  spellName: { file: "SpellName.csv", schema: Dbc.SpellNameRowSchema },
  spellPower: { file: "SpellPower.csv", schema: Dbc.SpellPowerRowSchema },
  spellProcsPerMinute: { file: "SpellProcsPerMinute.csv", schema: Dbc.SpellProcsPerMinuteRowSchema },
  spellProcsPerMinuteMod: { file: "SpellProcsPerMinuteMod.csv", schema: Dbc.SpellProcsPerMinuteModRowSchema },
  spellRadius: { file: "SpellRadius.csv", schema: Dbc.SpellRadiusRowSchema },
  spellRange: { file: "SpellRange.csv", schema: Dbc.SpellRangeRowSchema },
  spellTargetRestrictions: { file: "SpellTargetRestrictions.csv", schema: Dbc.SpellTargetRestrictionsRowSchema },
} as const;

// prettier-ignore
export const ITEM_TABLES = {
  item: { file: "Item.csv", schema: Dbc.ItemRowSchema },
  itemAppearance: { file: "ItemAppearance.csv", schema: Dbc.ItemAppearanceRowSchema },
  itemBonus: { file: "ItemBonus.csv", schema: Dbc.ItemBonusRowSchema },
  itemBonusList: { file: "ItemBonusList.csv", schema: Dbc.ItemBonusListRowSchema },
  itemBonusListGroup: { file: "ItemBonusListGroup.csv", schema: Dbc.ItemBonusListGroupRowSchema },
  itemBonusListGroupEntry: { file: "ItemBonusListGroupEntry.csv", schema: Dbc.ItemBonusListGroupEntryRowSchema },
  itemBonusSeason: { file: "ItemBonusSeason.csv", schema: Dbc.ItemBonusSeasonRowSchema },
  itemBonusSeasonUpgradeCost: { file: "ItemBonusSeasonUpgradeCost.csv", schema: Dbc.ItemBonusSeasonUpgradeCostRowSchema },
  itemBonusTree: { file: "ItemBonusTree.csv", schema: Dbc.ItemBonusTreeRowSchema },
  itemBonusTreeNode: { file: "ItemBonusTreeNode.csv", schema: Dbc.ItemBonusTreeNodeRowSchema },
  itemClass: { file: "ItemClass.csv", schema: Dbc.ItemClassRowSchema },
  itemEffect: { file: "ItemEffect.csv", schema: Dbc.ItemEffectRowSchema },
  itemModifiedAppearance: { file: "ItemModifiedAppearance.csv", schema: Dbc.ItemModifiedAppearanceRowSchema },
  itemNameDescription: { file: "ItemNameDescription.csv", schema: Dbc.ItemNameDescriptionRowSchema },
  itemSet: { file: "ItemSet.csv", schema: Dbc.ItemSetRowSchema },
  itemSetSpell: { file: "ItemSetSpell.csv", schema: Dbc.ItemSetSpellRowSchema },
  itemSparse: { file: "ItemSparse.csv", schema: Dbc.ItemSparseRowSchema },
  itemSubClass: { file: "ItemSubClass.csv", schema: Dbc.ItemSubClassRowSchema },
  itemXBonusTree: { file: "ItemXBonusTree.csv", schema: Dbc.ItemXBonusTreeRowSchema },
  itemXItemEffect: { file: "ItemXItemEffect.csv", schema: Dbc.ItemXItemEffectRowSchema },
  journalEncounter: { file: "JournalEncounter.csv", schema: Dbc.JournalEncounterRowSchema },
  journalEncounterItem: { file: "JournalEncounterItem.csv", schema: Dbc.JournalEncounterItemRowSchema },
  journalInstance: { file: "JournalInstance.csv", schema: Dbc.JournalInstanceRowSchema },
  manifestInterfaceData: { file: "ManifestInterfaceData.csv", schema: Dbc.ManifestInterfaceDataRowSchema },
  modifiedCraftingReagentItem: { file: "ModifiedCraftingReagentItem.csv", schema: Dbc.ModifiedCraftingReagentItemRowSchema },
} as const;
