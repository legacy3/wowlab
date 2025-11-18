import type { Map } from "immutable";

import * as Dbc from "@packages/innocent-schemas/Dbc";

export interface RawDBCData {
  fileData: Dbc.FileDataRow[];
  spellCastingRequirements: Dbc.SpellCastingRequirementsRow[];
  spellCastTimes: Dbc.SpellCastTimesRow[];
  spellCategories: Dbc.SpellCategoriesRow[];
  spellCategory: Dbc.SpellCategoryRow[];
  spellCooldowns: Dbc.SpellCooldownsRow[];
  spellDuration: Dbc.SpellDurationRow[];
  spellEffect: Dbc.SpellEffectRow[];
  spellEmpower: Dbc.SpellEmpowerRow[];
  spellEmpowerStage: Dbc.SpellEmpowerStageRow[];
  spellInterrupts: Dbc.SpellInterruptsRow[];
  spellMisc: Dbc.SpellMiscRow[];
  spellName: Dbc.SpellNameRow[];
  spellRadius: Dbc.SpellRadiusRow[];
  spellRange: Dbc.SpellRangeRow[];
  spellTargetRestrictions: Dbc.SpellTargetRestrictionsRow[];
}

export interface SpellInfoCache {
  fileData: Map<number, Dbc.FileDataRow>;
  spellCastingRequirements: Map<number, Dbc.SpellCastingRequirementsRow[]>;
  spellCastTimes: Map<number, Dbc.SpellCastTimesRow[]>;
  spellCategories: Map<number, Dbc.SpellCategoriesRow[]>;
  spellCategory: Map<number, Dbc.SpellCategoryRow[]>;
  spellCooldowns: Map<number, Dbc.SpellCooldownsRow[]>;
  spellDuration: Map<number, Dbc.SpellDurationRow[]>;
  spellEffect: Map<number, Dbc.SpellEffectRow[]>;
  spellEmpower: Map<number, Dbc.SpellEmpowerRow[]>;
  spellEmpowerStage: Map<number, Dbc.SpellEmpowerStageRow[]>;
  spellInterrupts: Map<number, Dbc.SpellInterruptsRow[]>;
  spellMisc: Map<number, Dbc.SpellMiscRow[]>;
  spellName: Map<number, Dbc.SpellNameRow>;
  spellRadius: Map<number, Dbc.SpellRadiusRow[]>;
  spellRange: Map<number, Dbc.SpellRangeRow[]>;
  spellTargetRestrictions: Map<number, Dbc.SpellTargetRestrictionsRow[]>;
}
