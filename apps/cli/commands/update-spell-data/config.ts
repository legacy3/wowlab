import * as Dbc from "@packages/innocent-schemas/Dbc";
import * as path from "node:path";

export const REPO_ROOT = path.join(process.cwd(), "../..");
export const DBC_DATA_DIR = path.join(
  REPO_ROOT,
  "third_party/wow-gamedata/data",
);

export const DBC_TABLE_CONFIG = [
  {
    file: "FileData.json",
    key: "fileData",
    type: {} as Dbc.FileDataRow,
  },
  {
    file: "SpellCastingRequirements.json",
    key: "spellCastingRequirements",
    type: {} as Dbc.SpellCastingRequirementsRow,
  },
  {
    file: "SpellCastTimes.json",
    key: "spellCastTimes",
    type: {} as Dbc.SpellCastTimesRow,
  },
  {
    file: "SpellCategories.json",
    key: "spellCategories",
    type: {} as Dbc.SpellCategoriesRow,
  },
  {
    file: "SpellCategory.json",
    key: "spellCategory",
    type: {} as Dbc.SpellCategoryRow,
  },
  {
    file: "SpellCooldowns.json",
    key: "spellCooldowns",
    type: {} as Dbc.SpellCooldownsRow,
  },
  {
    file: "SpellDuration.json",
    key: "spellDuration",
    type: {} as Dbc.SpellDurationRow,
  },
  {
    file: "SpellEffect.json",
    key: "spellEffect",
    type: {} as Dbc.SpellEffectRow,
  },
  {
    file: "SpellEmpower.json",
    key: "spellEmpower",
    type: {} as Dbc.SpellEmpowerRow,
  },
  {
    file: "SpellEmpowerStage.json",
    key: "spellEmpowerStage",
    type: {} as Dbc.SpellEmpowerStageRow,
  },
  {
    file: "SpellInterrupts.json",
    key: "spellInterrupts",
    type: {} as Dbc.SpellInterruptsRow,
  },
  { file: "SpellMisc.json", key: "spellMisc", type: {} as Dbc.SpellMiscRow },
  { file: "SpellName.json", key: "spellName", type: {} as Dbc.SpellNameRow },
  {
    file: "SpellRadius.json",
    key: "spellRadius",
    type: {} as Dbc.SpellRadiusRow,
  },
  { file: "SpellRange.json", key: "spellRange", type: {} as Dbc.SpellRangeRow },
  {
    file: "SpellTargetRestrictions.json",
    key: "spellTargetRestrictions",
    type: {} as Dbc.SpellTargetRestrictionsRow,
  },
] as const;
