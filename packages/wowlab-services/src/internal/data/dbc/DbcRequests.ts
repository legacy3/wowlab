import type * as Schemas from "@wowlab/core/Schemas";

import { DbcError } from "@wowlab/core/Errors";
import * as Request from "effect/Request";

// By ID
export class GetChrClass extends Request.TaggedClass("GetChrClass")<
  Schemas.Dbc.ChrClassesRow | undefined,
  DbcError,
  { readonly id: number }
> {}

export class GetChrSpecialization extends Request.TaggedClass(
  "GetChrSpecialization",
)<
  Schemas.Dbc.ChrSpecializationRow | undefined,
  DbcError,
  { readonly id: number }
> {}

export class GetDifficulty extends Request.TaggedClass("GetDifficulty")<
  Schemas.Dbc.DifficultyRow | undefined,
  DbcError,
  { readonly id: number }
> {}

export class GetExpectedStatMod extends Request.TaggedClass(
  "GetExpectedStatMod",
)<
  Schemas.Dbc.ExpectedStatModRow | undefined,
  DbcError,
  { readonly id: number }
> {}

export class GetItem extends Request.TaggedClass("GetItem")<
  Schemas.Dbc.ItemRow | undefined,
  DbcError,
  { readonly id: number }
> {}

export class GetItemAppearance extends Request.TaggedClass("GetItemAppearance")<
  Schemas.Dbc.ItemAppearanceRow | undefined,
  DbcError,
  { readonly id: number }
> {}

export class GetItemEffect extends Request.TaggedClass("GetItemEffect")<
  Schemas.Dbc.ItemEffectRow | undefined,
  DbcError,
  { readonly id: number }
> {}

// By ItemID (FK, single result)
export class GetItemModifiedAppearance extends Request.TaggedClass(
  "GetItemModifiedAppearance",
)<
  Schemas.Dbc.ItemModifiedAppearanceRow | undefined,
  DbcError,
  { readonly itemId: number }
> {}

export class GetItemSparse extends Request.TaggedClass("GetItemSparse")<
  Schemas.Dbc.ItemSparseRow | undefined,
  DbcError,
  { readonly id: number }
> {}

export class GetItemXItemEffects extends Request.TaggedClass(
  "GetItemXItemEffects",
)<
  ReadonlyArray<Schemas.Dbc.ItemXItemEffectRow>,
  DbcError,
  { readonly itemId: number }
> {}

export class GetManifestInterfaceData extends Request.TaggedClass(
  "GetManifestInterfaceData",
)<
  Schemas.Dbc.ManifestInterfaceDataRow | undefined,
  DbcError,
  { readonly id: number }
> {}

export class GetSpecializationSpells extends Request.TaggedClass(
  "GetSpecializationSpells",
)<
  ReadonlyArray<Schemas.Dbc.SpecializationSpellsRow>,
  DbcError,
  { readonly specId: number }
> {}

export class GetSpell extends Request.TaggedClass("GetSpell")<
  Schemas.Dbc.SpellRow | undefined,
  DbcError,
  { readonly id: number }
> {}

export class GetSpellAuraOptions extends Request.TaggedClass(
  "GetSpellAuraOptions",
)<
  Schemas.Dbc.SpellAuraOptionsRow | undefined,
  DbcError,
  { readonly spellId: number }
> {}

export class GetSpellAuraRestrictions extends Request.TaggedClass(
  "GetSpellAuraRestrictions",
)<
  Schemas.Dbc.SpellAuraRestrictionsRow | undefined,
  DbcError,
  { readonly spellId: number }
> {}

export class GetSpellCastingRequirements extends Request.TaggedClass(
  "GetSpellCastingRequirements",
)<
  Schemas.Dbc.SpellCastingRequirementsRow | undefined,
  DbcError,
  { readonly spellId: number }
> {}

export class GetSpellCastTimes extends Request.TaggedClass("GetSpellCastTimes")<
  Schemas.Dbc.SpellCastTimesRow | undefined,
  DbcError,
  { readonly id: number }
> {}

export class GetSpellCategories extends Request.TaggedClass(
  "GetSpellCategories",
)<
  Schemas.Dbc.SpellCategoriesRow | undefined,
  DbcError,
  { readonly spellId: number }
> {}

export class GetSpellCategory extends Request.TaggedClass("GetSpellCategory")<
  Schemas.Dbc.SpellCategoryRow | undefined,
  DbcError,
  { readonly id: number }
> {}

export class GetSpellClassOptions extends Request.TaggedClass(
  "GetSpellClassOptions",
)<
  Schemas.Dbc.SpellClassOptionsRow | undefined,
  DbcError,
  { readonly spellId: number }
> {}

export class GetSpellCooldowns extends Request.TaggedClass("GetSpellCooldowns")<
  Schemas.Dbc.SpellCooldownsRow | undefined,
  DbcError,
  { readonly spellId: number }
> {}

export class GetSpellDescriptionVariables extends Request.TaggedClass(
  "GetSpellDescriptionVariables",
)<
  Schemas.Dbc.SpellDescriptionVariablesRow | undefined,
  DbcError,
  { readonly id: number }
> {}

export class GetSpellDuration extends Request.TaggedClass("GetSpellDuration")<
  Schemas.Dbc.SpellDurationRow | undefined,
  DbcError,
  { readonly id: number }
> {}

export class GetSpellEffects extends Request.TaggedClass("GetSpellEffects")<
  ReadonlyArray<Schemas.Dbc.SpellEffectRow>,
  DbcError,
  { readonly spellId: number }
> {}

export class GetSpellEmpower extends Request.TaggedClass("GetSpellEmpower")<
  Schemas.Dbc.SpellEmpowerRow | undefined,
  DbcError,
  { readonly spellId: number }
> {}

export class GetSpellEmpowerStages extends Request.TaggedClass(
  "GetSpellEmpowerStages",
)<
  ReadonlyArray<Schemas.Dbc.SpellEmpowerStageRow>,
  DbcError,
  { readonly spellEmpowerId: number }
> {}

export class GetSpellInterrupts extends Request.TaggedClass(
  "GetSpellInterrupts",
)<
  Schemas.Dbc.SpellInterruptsRow | undefined,
  DbcError,
  { readonly spellId: number }
> {}

export class GetSpellLearnSpell extends Request.TaggedClass(
  "GetSpellLearnSpell",
)<
  ReadonlyArray<Schemas.Dbc.SpellLearnSpellRow>,
  DbcError,
  { readonly spellId: number }
> {}

export class GetSpellLevels extends Request.TaggedClass("GetSpellLevels")<
  ReadonlyArray<Schemas.Dbc.SpellLevelsRow>,
  DbcError,
  { readonly spellId: number }
> {}

// By SpellID (FK, single result)
export class GetSpellMisc extends Request.TaggedClass("GetSpellMisc")<
  Schemas.Dbc.SpellMiscRow | undefined,
  DbcError,
  { readonly spellId: number }
> {}

export class GetSpellName extends Request.TaggedClass("GetSpellName")<
  Schemas.Dbc.SpellNameRow | undefined,
  DbcError,
  { readonly id: number }
> {}

export class GetSpellPower extends Request.TaggedClass("GetSpellPower")<
  ReadonlyArray<Schemas.Dbc.SpellPowerRow>,
  DbcError,
  { readonly spellId: number }
> {}

export class GetSpellProcsPerMinute extends Request.TaggedClass(
  "GetSpellProcsPerMinute",
)<
  Schemas.Dbc.SpellProcsPerMinuteRow | undefined,
  DbcError,
  { readonly id: number }
> {}

export class GetSpellProcsPerMinuteMods extends Request.TaggedClass(
  "GetSpellProcsPerMinuteMods",
)<
  ReadonlyArray<Schemas.Dbc.SpellProcsPerMinuteModRow>,
  DbcError,
  { readonly spellProcsPerMinuteId: number }
> {}

export class GetSpellRadius extends Request.TaggedClass("GetSpellRadius")<
  Schemas.Dbc.SpellRadiusRow | undefined,
  DbcError,
  { readonly id: number }
> {}

export class GetSpellRange extends Request.TaggedClass("GetSpellRange")<
  Schemas.Dbc.SpellRangeRow | undefined,
  DbcError,
  { readonly id: number }
> {}

export class GetSpellReplacement extends Request.TaggedClass(
  "GetSpellReplacement",
)<
  Schemas.Dbc.SpellReplacementRow | undefined,
  DbcError,
  { readonly spellId: number }
> {}

export class GetSpellShapeshift extends Request.TaggedClass(
  "GetSpellShapeshift",
)<
  Schemas.Dbc.SpellShapeshiftRow | undefined,
  DbcError,
  { readonly spellId: number }
> {}

export class GetSpellShapeshiftForm extends Request.TaggedClass(
  "GetSpellShapeshiftForm",
)<
  Schemas.Dbc.SpellShapeshiftFormRow | undefined,
  DbcError,
  { readonly id: number }
> {}

export class GetSpellTargetRestrictions extends Request.TaggedClass(
  "GetSpellTargetRestrictions",
)<
  Schemas.Dbc.SpellTargetRestrictionsRow | undefined,
  DbcError,
  { readonly spellId: number }
> {}

export class GetSpellTotems extends Request.TaggedClass("GetSpellTotems")<
  ReadonlyArray<Schemas.Dbc.SpellTotemsRow>,
  DbcError,
  { readonly spellId: number }
> {}

export class GetSpellXDescriptionVariables extends Request.TaggedClass(
  "GetSpellXDescriptionVariables",
)<
  ReadonlyArray<Schemas.Dbc.SpellXDescriptionVariablesRow>,
  DbcError,
  { readonly spellId: number }
> {}

export class GetTraitDefinition extends Request.TaggedClass(
  "GetTraitDefinition",
)<
  Schemas.Dbc.TraitDefinitionRow | undefined,
  DbcError,
  { readonly id: number }
> {}

// By FK (array results)
export class GetTraitEdgesForTree extends Request.TaggedClass(
  "GetTraitEdgesForTree",
)<
  ReadonlyArray<Schemas.Dbc.TraitEdgeRow>,
  DbcError,
  { readonly treeId: number }
> {}

export class GetTraitNode extends Request.TaggedClass("GetTraitNode")<
  Schemas.Dbc.TraitNodeRow | undefined,
  DbcError,
  { readonly id: number }
> {}

export class GetTraitNodeEntry extends Request.TaggedClass("GetTraitNodeEntry")<
  Schemas.Dbc.TraitNodeEntryRow | undefined,
  DbcError,
  { readonly id: number }
> {}

export class GetTraitNodesForTree extends Request.TaggedClass(
  "GetTraitNodesForTree",
)<
  ReadonlyArray<Schemas.Dbc.TraitNodeRow>,
  DbcError,
  { readonly treeId: number }
> {}

export class GetTraitNodeXTraitNodeEntries extends Request.TaggedClass(
  "GetTraitNodeXTraitNodeEntries",
)<
  ReadonlyArray<Schemas.Dbc.TraitNodeXTraitNodeEntryRow>,
  DbcError,
  { readonly nodeId: number }
> {}

export class GetTraitNodeGroupXTraitCosts extends Request.TaggedClass(
  "GetTraitNodeGroupXTraitCosts",
)<
  ReadonlyArray<Schemas.Dbc.TraitNodeGroupXTraitCostRow>,
  DbcError,
  { readonly groupId: number }
> {}

export class GetTraitSubTree extends Request.TaggedClass("GetTraitSubTree")<
  Schemas.Dbc.TraitSubTreeRow | undefined,
  DbcError,
  { readonly id: number }
> {}

export class GetTraitTree extends Request.TaggedClass("GetTraitTree")<
  Schemas.Dbc.TraitTreeRow | undefined,
  DbcError,
  { readonly id: number }
> {}

export class GetTraitTreeLoadout extends Request.TaggedClass(
  "GetTraitTreeLoadout",
)<
  Schemas.Dbc.TraitTreeLoadoutRow | undefined,
  DbcError,
  { readonly specId: number }
> {}

export class GetTraitTreeLoadoutEntries extends Request.TaggedClass(
  "GetTraitTreeLoadoutEntries",
)<
  ReadonlyArray<Schemas.Dbc.TraitTreeLoadoutEntryRow>,
  DbcError,
  { readonly loadoutId: number }
> {}

export class GetTraitTreeXTraitCurrencies extends Request.TaggedClass(
  "GetTraitTreeXTraitCurrencies",
)<
  ReadonlyArray<Schemas.Dbc.TraitTreeXTraitCurrencyRow>,
  DbcError,
  { readonly treeId: number }
> {}

export class GetUiTextureAtlasElement extends Request.TaggedClass(
  "GetUiTextureAtlasElement",
)<
  Schemas.Dbc.UiTextureAtlasElementRow | undefined,
  DbcError,
  { readonly id: number }
> {}
