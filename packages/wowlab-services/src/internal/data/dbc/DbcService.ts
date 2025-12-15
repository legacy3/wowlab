import { DbcError } from "@wowlab/core/Errors";
import * as Schemas from "@wowlab/core/Schemas";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";

export interface DbcServiceInterface {
  readonly getChrClass: (
    id: number,
  ) => Effect.Effect<Schemas.Dbc.ChrClassesRow | undefined, DbcError>;

  readonly getChrClasses: () => Effect.Effect<
    ReadonlyArray<Schemas.Dbc.ChrClassesRow>,
    DbcError
  >;

  readonly getChrSpecialization: (
    id: number,
  ) => Effect.Effect<Schemas.Dbc.ChrSpecializationRow | undefined, DbcError>;

  readonly getChrSpecializations: () => Effect.Effect<
    ReadonlyArray<Schemas.Dbc.ChrSpecializationRow>,
    DbcError
  >;

  readonly getContentTuningXExpected: (
    contentTuningId: number,
    mythicPlusSeasonId: number,
  ) => Effect.Effect<
    ReadonlyArray<Schemas.Dbc.ContentTuningXExpectedRow>,
    DbcError
  >;

  readonly getDifficulty: (
    id: number,
  ) => Effect.Effect<Schemas.Dbc.DifficultyRow | undefined, DbcError>;

  readonly getDifficultyChain: (
    id: number,
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.DifficultyRow>, DbcError>;

  readonly getExpectedStatMod: (
    id: number,
  ) => Effect.Effect<Schemas.Dbc.ExpectedStatModRow | undefined, DbcError>;

  readonly getExpectedStats: (
    level: number,
    expansion: number,
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.ExpectedStatRow>, DbcError>;

  readonly getItem: (
    itemId: number,
  ) => Effect.Effect<Schemas.Dbc.ItemRow | undefined, DbcError>;

  readonly getItemAppearance: (
    id: number,
  ) => Effect.Effect<Schemas.Dbc.ItemAppearanceRow | undefined, DbcError>;

  readonly getItemEffect: (
    id: number,
  ) => Effect.Effect<Schemas.Dbc.ItemEffectRow | undefined, DbcError>;

  readonly getItemModifiedAppearance: (
    itemId: number,
  ) => Effect.Effect<
    Schemas.Dbc.ItemModifiedAppearanceRow | undefined,
    DbcError
  >;

  readonly getItemSparse: (
    itemId: number,
  ) => Effect.Effect<Schemas.Dbc.ItemSparseRow | undefined, DbcError>;

  readonly getItemXItemEffects: (
    itemId: number,
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.ItemXItemEffectRow>, DbcError>;

  readonly getManifestInterfaceData: (
    id: number,
  ) => Effect.Effect<
    Schemas.Dbc.ManifestInterfaceDataRow | undefined,
    DbcError
  >;
  readonly getSpecializationSpells: (
    specId: number,
  ) => Effect.Effect<
    ReadonlyArray<Schemas.Dbc.SpecializationSpellsRow>,
    DbcError
  >;

  readonly getSpecSetMembers: (
    specSetIds: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.SpecSetMemberRow>, DbcError>;

  readonly getSpell: (
    spellId: number,
  ) => Effect.Effect<Schemas.Dbc.SpellRow | undefined, DbcError>;

  readonly getSpellAuraOptions: (
    spellId: number,
  ) => Effect.Effect<Schemas.Dbc.SpellAuraOptionsRow | undefined, DbcError>;

  readonly getSpellAuraRestrictions: (
    spellId: number,
  ) => Effect.Effect<
    Schemas.Dbc.SpellAuraRestrictionsRow | undefined,
    DbcError
  >;

  readonly getSpellCastingRequirements: (
    spellId: number,
  ) => Effect.Effect<
    Schemas.Dbc.SpellCastingRequirementsRow | undefined,
    DbcError
  >;

  readonly getSpellCastTimes: (
    id: number,
  ) => Effect.Effect<Schemas.Dbc.SpellCastTimesRow | undefined, DbcError>;

  readonly getSpellCategories: (
    spellId: number,
  ) => Effect.Effect<Schemas.Dbc.SpellCategoriesRow | undefined, DbcError>;

  readonly getSpellCategory: (
    id: number,
  ) => Effect.Effect<Schemas.Dbc.SpellCategoryRow | undefined, DbcError>;

  readonly getSpellClassOptions: (
    spellId: number,
  ) => Effect.Effect<Schemas.Dbc.SpellClassOptionsRow | undefined, DbcError>;

  readonly getSpellCooldowns: (
    spellId: number,
  ) => Effect.Effect<Schemas.Dbc.SpellCooldownsRow | undefined, DbcError>;

  readonly getSpellDescriptionVariables: (
    id: number,
  ) => Effect.Effect<
    Schemas.Dbc.SpellDescriptionVariablesRow | undefined,
    DbcError
  >;

  readonly getSpellDuration: (
    id: number,
  ) => Effect.Effect<Schemas.Dbc.SpellDurationRow | undefined, DbcError>;

  readonly getSpellEffects: (
    spellId: number,
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.SpellEffectRow>, DbcError>;

  readonly getSpellEmpower: (
    spellId: number,
  ) => Effect.Effect<Schemas.Dbc.SpellEmpowerRow | undefined, DbcError>;

  readonly getSpellEmpowerStages: (
    spellEmpowerId: number,
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.SpellEmpowerStageRow>, DbcError>;

  readonly getSpellInterrupts: (
    spellId: number,
  ) => Effect.Effect<Schemas.Dbc.SpellInterruptsRow | undefined, DbcError>;

  readonly getSpellLearnSpell: (
    spellId: number,
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.SpellLearnSpellRow>, DbcError>;

  readonly getSpellLevels: (
    spellId: number,
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.SpellLevelsRow>, DbcError>;

  readonly getSpellMisc: (
    spellId: number,
  ) => Effect.Effect<Schemas.Dbc.SpellMiscRow | undefined, DbcError>;

  readonly getSpellName: (
    spellId: number,
  ) => Effect.Effect<Schemas.Dbc.SpellNameRow | undefined, DbcError>;

  readonly getSpellPower: (
    spellId: number,
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.SpellPowerRow>, DbcError>;

  readonly getSpellProcsPerMinute: (
    id: number,
  ) => Effect.Effect<Schemas.Dbc.SpellProcsPerMinuteRow | undefined, DbcError>;

  readonly getSpellProcsPerMinuteMods: (
    spellProcsPerMinuteId: number,
  ) => Effect.Effect<
    ReadonlyArray<Schemas.Dbc.SpellProcsPerMinuteModRow>,
    DbcError
  >;

  readonly getSpellRadius: (
    id: number,
  ) => Effect.Effect<Schemas.Dbc.SpellRadiusRow | undefined, DbcError>;

  readonly getSpellRange: (
    id: number,
  ) => Effect.Effect<Schemas.Dbc.SpellRangeRow | undefined, DbcError>;

  readonly getSpellReplacement: (
    spellId: number,
  ) => Effect.Effect<Schemas.Dbc.SpellReplacementRow | undefined, DbcError>;

  readonly getSpellShapeshift: (
    spellId: number,
  ) => Effect.Effect<Schemas.Dbc.SpellShapeshiftRow | undefined, DbcError>;

  readonly getSpellShapeshiftForm: (
    id: number,
  ) => Effect.Effect<Schemas.Dbc.SpellShapeshiftFormRow | undefined, DbcError>;

  readonly getSpellTargetRestrictions: (
    spellId: number,
  ) => Effect.Effect<
    Schemas.Dbc.SpellTargetRestrictionsRow | undefined,
    DbcError
  >;

  readonly getSpellTotems: (
    spellId: number,
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.SpellTotemsRow>, DbcError>;

  readonly getSpellXDescriptionVariables: (
    spellId: number,
  ) => Effect.Effect<
    ReadonlyArray<Schemas.Dbc.SpellXDescriptionVariablesRow>,
    DbcError
  >;

  readonly getTraitConds: (
    condIds: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.TraitCondRow>, DbcError>;

  readonly getTraitDefinition: (
    id: number,
  ) => Effect.Effect<Schemas.Dbc.TraitDefinitionRow | undefined, DbcError>;

  readonly getTraitCost: (
    id: number,
  ) => Effect.Effect<Schemas.Dbc.TraitCostRow | undefined, DbcError>;

  readonly getTraitCurrency: (
    id: number,
  ) => Effect.Effect<Schemas.Dbc.TraitCurrencyRow | undefined, DbcError>;

  readonly getTraitEdgesForTree: (
    treeId: number,
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.TraitEdgeRow>, DbcError>;

  readonly getTraitNode: (
    id: number,
  ) => Effect.Effect<Schemas.Dbc.TraitNodeRow | undefined, DbcError>;

  readonly getTraitNodeEntry: (
    id: number,
  ) => Effect.Effect<Schemas.Dbc.TraitNodeEntryRow | undefined, DbcError>;

  readonly getTraitNodeGroupXTraitConds: (
    groupIds: readonly number[],
  ) => Effect.Effect<
    ReadonlyArray<Schemas.Dbc.TraitNodeGroupXTraitCondRow>,
    DbcError
  >;
  readonly getTraitNodeGroupXTraitCosts: (
    groupIds: readonly number[],
  ) => Effect.Effect<
    ReadonlyArray<Schemas.Dbc.TraitNodeGroupXTraitCostRow>,
    DbcError
  >;

  readonly getTraitNodeGroupXTraitNodes: (
    nodeIds: readonly number[],
  ) => Effect.Effect<
    ReadonlyArray<Schemas.Dbc.TraitNodeGroupXTraitNodeRow>,
    DbcError
  >;

  readonly getTraitNodesForTree: (
    treeId: number,
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.TraitNodeRow>, DbcError>;

  readonly getTraitNodeXTraitConds: (
    nodeIds: readonly number[],
  ) => Effect.Effect<
    ReadonlyArray<Schemas.Dbc.TraitNodeXTraitCondRow>,
    DbcError
  >;

  readonly getTraitNodeXTraitNodeEntries: (
    nodeId: number,
  ) => Effect.Effect<
    ReadonlyArray<Schemas.Dbc.TraitNodeXTraitNodeEntryRow>,
    DbcError
  >;

  readonly getTraitSubTree: (
    id: number,
  ) => Effect.Effect<Schemas.Dbc.TraitSubTreeRow | undefined, DbcError>;

  readonly getTraitTree: (
    id: number,
  ) => Effect.Effect<Schemas.Dbc.TraitTreeRow | undefined, DbcError>;

  readonly getTraitTreeLoadout: (
    specId: number,
  ) => Effect.Effect<Schemas.Dbc.TraitTreeLoadoutRow | undefined, DbcError>;

  readonly getTraitTreeLoadoutEntries: (
    loadoutId: number,
  ) => Effect.Effect<
    ReadonlyArray<Schemas.Dbc.TraitTreeLoadoutEntryRow>,
    DbcError
  >;
  readonly getTraitTreeXTraitCurrencies: (
    treeId: number,
  ) => Effect.Effect<
    ReadonlyArray<Schemas.Dbc.TraitTreeXTraitCurrencyRow>,
    DbcError
  >;

  readonly getUiTextureAtlasElement: (
    id: number,
  ) => Effect.Effect<
    Schemas.Dbc.UiTextureAtlasElementRow | undefined,
    DbcError
  >;
}

export class DbcService extends Context.Tag("@wowlab/services/DbcService")<
  DbcService,
  DbcServiceInterface
>() {}
