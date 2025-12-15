import type * as Schemas from "@wowlab/core/Schemas";

import { DbcError } from "@wowlab/core/Errors";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Request from "effect/Request";
import * as RequestResolver from "effect/RequestResolver";

import {
  GetChrClass,
  GetChrSpecialization,
  GetDifficulty,
  GetExpectedStatMod,
  GetItem,
  GetItemAppearance,
  GetItemEffect,
  GetItemModifiedAppearance,
  GetItemSparse,
  GetItemXItemEffects,
  GetManifestInterfaceData,
  GetSpecializationSpells,
  GetSpell,
  GetSpellAuraOptions,
  GetSpellAuraRestrictions,
  GetSpellCastingRequirements,
  GetSpellCastTimes,
  GetSpellCategories,
  GetSpellCategory,
  GetSpellClassOptions,
  GetSpellCooldowns,
  GetSpellDescriptionVariables,
  GetSpellDuration,
  GetSpellEffects,
  GetSpellEmpower,
  GetSpellEmpowerStages,
  GetSpellInterrupts,
  GetSpellLearnSpell,
  GetSpellLevels,
  GetSpellMisc,
  GetSpellName,
  GetSpellPower,
  GetSpellProcsPerMinute,
  GetSpellProcsPerMinuteMods,
  GetSpellRadius,
  GetSpellRange,
  GetSpellReplacement,
  GetSpellShapeshift,
  GetSpellShapeshiftForm,
  GetSpellTargetRestrictions,
  GetSpellTotems,
  GetSpellXDescriptionVariables,
  GetTraitDefinition,
  GetTraitEdgesForTree,
  GetTraitNode,
  GetTraitNodeEntry,
  GetTraitNodeGroupXTraitCosts,
  GetTraitNodesForTree,
  GetTraitNodeXTraitNodeEntries,
  GetTraitSubTree,
  GetTraitTree,
  GetTraitTreeLoadout,
  GetTraitTreeLoadoutEntries,
  GetTraitTreeXTraitCurrencies,
  GetUiTextureAtlasElement,
} from "./DbcRequests.js";

export interface DbcBatchFetcherInterface {
  // By ID
  readonly fetchChrClassesByIds: (
    ids: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.ChrClassesRow>, DbcError>;
  readonly fetchChrSpecializationsByIds: (
    ids: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.ChrSpecializationRow>, DbcError>;
  readonly fetchDifficultiesByIds: (
    ids: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.DifficultyRow>, DbcError>;
  readonly fetchExpectedStatModsByIds: (
    ids: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.ExpectedStatModRow>, DbcError>;
  readonly fetchItemAppearancesByIds: (
    ids: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.ItemAppearanceRow>, DbcError>;
  readonly fetchItemEffectsByIds: (
    ids: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.ItemEffectRow>, DbcError>;
  // By ItemID (FK, single result)
  readonly fetchItemModifiedAppearancesByItemIds: (
    itemIds: readonly number[],
  ) => Effect.Effect<
    ReadonlyArray<Schemas.Dbc.ItemModifiedAppearanceRow>,
    DbcError
  >;
  readonly fetchItemsByIds: (
    ids: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.ItemRow>, DbcError>;
  readonly fetchItemSparsesByIds: (
    ids: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.ItemSparseRow>, DbcError>;
  // By FK (array results)
  readonly fetchItemXItemEffectsByItemIds: (
    itemIds: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.ItemXItemEffectRow>, DbcError>;
  readonly fetchManifestInterfaceDataByIds: (
    ids: readonly number[],
  ) => Effect.Effect<
    ReadonlyArray<Schemas.Dbc.ManifestInterfaceDataRow>,
    DbcError
  >;
  readonly fetchSpecializationSpellsBySpecIds: (
    specIds: readonly number[],
  ) => Effect.Effect<
    ReadonlyArray<Schemas.Dbc.SpecializationSpellsRow>,
    DbcError
  >;
  // By SpellID (FK, single result)
  readonly fetchSpellAuraOptionsBySpellIds: (
    spellIds: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.SpellAuraOptionsRow>, DbcError>;
  readonly fetchSpellAuraRestrictionsBySpellIds: (
    spellIds: readonly number[],
  ) => Effect.Effect<
    ReadonlyArray<Schemas.Dbc.SpellAuraRestrictionsRow>,
    DbcError
  >;
  readonly fetchSpellCastingRequirementsBySpellIds: (
    spellIds: readonly number[],
  ) => Effect.Effect<
    ReadonlyArray<Schemas.Dbc.SpellCastingRequirementsRow>,
    DbcError
  >;
  readonly fetchSpellCastTimesByIds: (
    ids: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.SpellCastTimesRow>, DbcError>;
  readonly fetchSpellCategoriesByIds: (
    ids: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.SpellCategoryRow>, DbcError>;
  readonly fetchSpellCategoriesBySpellIds: (
    spellIds: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.SpellCategoriesRow>, DbcError>;
  readonly fetchSpellClassOptionsBySpellIds: (
    spellIds: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.SpellClassOptionsRow>, DbcError>;
  readonly fetchSpellCooldownsBySpellIds: (
    spellIds: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.SpellCooldownsRow>, DbcError>;
  readonly fetchSpellDescriptionVariablesByIds: (
    ids: readonly number[],
  ) => Effect.Effect<
    ReadonlyArray<Schemas.Dbc.SpellDescriptionVariablesRow>,
    DbcError
  >;
  readonly fetchSpellDurationsByIds: (
    ids: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.SpellDurationRow>, DbcError>;
  readonly fetchSpellEffectsBySpellIds: (
    spellIds: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.SpellEffectRow>, DbcError>;
  readonly fetchSpellEmpowerBySpellIds: (
    spellIds: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.SpellEmpowerRow>, DbcError>;

  readonly fetchSpellEmpowerStagesByEmpowerIds: (
    empowerIds: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.SpellEmpowerStageRow>, DbcError>;
  readonly fetchSpellInterruptsBySpellIds: (
    spellIds: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.SpellInterruptsRow>, DbcError>;
  readonly fetchSpellLearnSpellBySpellIds: (
    spellIds: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.SpellLearnSpellRow>, DbcError>;
  readonly fetchSpellLevelsBySpellIds: (
    spellIds: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.SpellLevelsRow>, DbcError>;
  readonly fetchSpellMiscBySpellIds: (
    spellIds: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.SpellMiscRow>, DbcError>;
  readonly fetchSpellNamesByIds: (
    ids: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.SpellNameRow>, DbcError>;
  readonly fetchSpellPowerBySpellIds: (
    spellIds: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.SpellPowerRow>, DbcError>;
  readonly fetchSpellProcsPerMinuteByIds: (
    ids: readonly number[],
  ) => Effect.Effect<
    ReadonlyArray<Schemas.Dbc.SpellProcsPerMinuteRow>,
    DbcError
  >;
  readonly fetchSpellProcsPerMinuteModsByPpmIds: (
    ppmIds: readonly number[],
  ) => Effect.Effect<
    ReadonlyArray<Schemas.Dbc.SpellProcsPerMinuteModRow>,
    DbcError
  >;
  readonly fetchSpellRadiusByIds: (
    ids: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.SpellRadiusRow>, DbcError>;
  readonly fetchSpellRangesByIds: (
    ids: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.SpellRangeRow>, DbcError>;
  readonly fetchSpellReplacementBySpellIds: (
    spellIds: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.SpellReplacementRow>, DbcError>;

  readonly fetchSpellsByIds: (
    ids: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.SpellRow>, DbcError>;

  readonly fetchSpellShapeshiftBySpellIds: (
    spellIds: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.SpellShapeshiftRow>, DbcError>;
  readonly fetchSpellShapeshiftFormsByIds: (
    ids: readonly number[],
  ) => Effect.Effect<
    ReadonlyArray<Schemas.Dbc.SpellShapeshiftFormRow>,
    DbcError
  >;
  readonly fetchSpellTargetRestrictionsBySpellIds: (
    spellIds: readonly number[],
  ) => Effect.Effect<
    ReadonlyArray<Schemas.Dbc.SpellTargetRestrictionsRow>,
    DbcError
  >;
  readonly fetchSpellTotemsBySpellIds: (
    spellIds: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.SpellTotemsRow>, DbcError>;
  readonly fetchSpellXDescriptionVariablesBySpellIds: (
    spellIds: readonly number[],
  ) => Effect.Effect<
    ReadonlyArray<Schemas.Dbc.SpellXDescriptionVariablesRow>,
    DbcError
  >;
  readonly fetchTraitDefinitionsByIds: (
    ids: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.TraitDefinitionRow>, DbcError>;
  readonly fetchTraitEdgesByTreeIds: (
    treeIds: readonly number[],
  ) => Effect.Effect<
    ReadonlyMap<number, ReadonlyArray<Schemas.Dbc.TraitEdgeRow>>,
    DbcError
  >;
  readonly fetchTraitNodeEntriesByIds: (
    ids: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.TraitNodeEntryRow>, DbcError>;
  readonly fetchTraitNodeGroupXTraitCostsByGroupIds: (
    groupIds: readonly number[],
  ) => Effect.Effect<
    ReadonlyArray<Schemas.Dbc.TraitNodeGroupXTraitCostRow>,
    DbcError
  >;
  readonly fetchTraitNodesByIds: (
    ids: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.TraitNodeRow>, DbcError>;
  readonly fetchTraitNodesByTreeIds: (
    treeIds: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.TraitNodeRow>, DbcError>;
  readonly fetchTraitNodeXEntriesByNodeIds: (
    nodeIds: readonly number[],
  ) => Effect.Effect<
    ReadonlyArray<Schemas.Dbc.TraitNodeXTraitNodeEntryRow>,
    DbcError
  >;
  readonly fetchTraitSubTreesByIds: (
    ids: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.TraitSubTreeRow>, DbcError>;
  readonly fetchTraitTreeLoadoutEntriesByLoadoutIds: (
    loadoutIds: readonly number[],
  ) => Effect.Effect<
    ReadonlyArray<Schemas.Dbc.TraitTreeLoadoutEntryRow>,
    DbcError
  >;
  readonly fetchTraitTreeLoadoutsBySpecIds: (
    specIds: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.TraitTreeLoadoutRow>, DbcError>;
  readonly fetchTraitTreeXTraitCurrenciesByTreeIds: (
    treeIds: readonly number[],
  ) => Effect.Effect<
    ReadonlyArray<Schemas.Dbc.TraitTreeXTraitCurrencyRow>,
    DbcError
  >;
  readonly fetchTraitTreesByIds: (
    ids: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.TraitTreeRow>, DbcError>;

  readonly fetchUiTextureAtlasElementsByIds: (
    ids: readonly number[],
  ) => Effect.Effect<
    ReadonlyArray<Schemas.Dbc.UiTextureAtlasElementRow>,
    DbcError
  >;
}

export class DbcBatchFetcher extends Context.Tag(
  "@wowlab/services/DbcBatchFetcher",
)<DbcBatchFetcher, DbcBatchFetcherInterface>() {}

const createByIdResolver = <Row extends { readonly ID: number }>(
  fetchByIds: (
    ids: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Row>, DbcError>,
) =>
  RequestResolver.makeBatched(
    (
      requests: ReadonlyArray<
        { readonly id: number } & Request.Request<Row | undefined, DbcError>
      >,
    ) =>
      Effect.gen(function* () {
        const ids = [...new Set(requests.map((r) => r.id))];
        if (ids.length === 0) {
          return;
        }

        const rows = yield* fetchByIds(ids);
        const rowMap = new Map<number, Row>();

        for (const row of rows) {
          rowMap.set(row.ID, row);
        }

        for (const req of requests) {
          yield* Request.completeEffect(
            req,
            Effect.succeed(rowMap.get(req.id)),
          );
        }
      }).pipe(
        Effect.catchAll((error) =>
          Effect.forEach(
            requests,
            (req) => Request.completeEffect(req, Effect.fail(error)),
            { discard: true },
          ),
        ),
      ),
  );

const createByFkSingleResolver = <
  Row,
  FK extends keyof Row & string,
  Req extends Request.Request<Row | undefined, DbcError>,
>(
  fetchByFks: (
    fkValues: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Row>, DbcError>,
  fkField: FK,
  getFkValue: (req: Req) => number,
): RequestResolver.RequestResolver<Req, never> =>
  RequestResolver.makeBatched((requests: ReadonlyArray<Req>) =>
    Effect.gen(function* () {
      const fkValues = [...new Set(requests.map(getFkValue))];
      if (fkValues.length === 0) {
        return;
      }

      const rows = yield* fetchByFks(fkValues);
      const rowByFk = new Map<number, Row>();

      for (const row of rows) {
        const fkValue = row[fkField] as number;

        if (!rowByFk.has(fkValue)) {
          rowByFk.set(fkValue, row);
        }
      }

      for (const req of requests) {
        yield* Request.completeEffect(
          req,
          Effect.succeed(rowByFk.get(getFkValue(req))) as Effect.Effect<
            Request.Request.Success<Req>,
            never,
            never
          >,
        );
      }
    }).pipe(
      Effect.catchAll((error) =>
        Effect.forEach(
          requests,
          (req) =>
            Request.completeEffect(
              req,
              Effect.fail(error) as Effect.Effect<
                never,
                Request.Request.Error<Req>,
                never
              >,
            ),
          { discard: true },
        ),
      ),
    ),
  );

const createByFkArrayResolver = <
  Row,
  FK extends keyof Row & string,
  Req extends Request.Request<ReadonlyArray<Row>, DbcError>,
>(
  fetchByFks: (
    fkValues: readonly number[],
  ) => Effect.Effect<ReadonlyArray<Row>, DbcError>,
  fkField: FK,
  getFkValue: (req: Req) => number,
): RequestResolver.RequestResolver<Req, never> =>
  RequestResolver.makeBatched((requests: ReadonlyArray<Req>) =>
    Effect.gen(function* () {
      const fkValues = [...new Set(requests.map(getFkValue))];
      if (fkValues.length === 0) {
        return;
      }

      const rows = yield* fetchByFks(fkValues);
      const rowsByFk = new Map<number, Row[]>();

      for (const row of rows) {
        const fkValue = row[fkField] as number;
        const existing = rowsByFk.get(fkValue) ?? [];

        existing.push(row);
        rowsByFk.set(fkValue, existing);
      }

      for (const req of requests) {
        yield* Request.completeEffect(
          req,
          Effect.succeed(rowsByFk.get(getFkValue(req)) ?? []) as Effect.Effect<
            Request.Request.Success<Req>,
            never,
            never
          >,
        );
      }
    }).pipe(
      Effect.catchAll((error) =>
        Effect.forEach(
          requests,
          (req) =>
            Request.completeEffect(
              req,
              Effect.fail(error) as Effect.Effect<
                never,
                Request.Request.Error<Req>,
                never
              >,
            ),
          { discard: true },
        ),
      ),
    ),
  );

export interface DbcResolversInterface {
  // By ID
  readonly chrClassResolver: RequestResolver.RequestResolver<
    GetChrClass,
    never
  >;
  readonly chrSpecializationResolver: RequestResolver.RequestResolver<
    GetChrSpecialization,
    never
  >;
  readonly difficultyResolver: RequestResolver.RequestResolver<
    GetDifficulty,
    never
  >;
  readonly expectedStatModResolver: RequestResolver.RequestResolver<
    GetExpectedStatMod,
    never
  >;
  readonly itemAppearanceResolver: RequestResolver.RequestResolver<
    GetItemAppearance,
    never
  >;
  readonly itemEffectResolver: RequestResolver.RequestResolver<
    GetItemEffect,
    never
  >;
  // By ItemID (FK, single result)
  readonly itemModifiedAppearanceResolver: RequestResolver.RequestResolver<
    GetItemModifiedAppearance,
    never
  >;
  readonly itemResolver: RequestResolver.RequestResolver<GetItem, never>;
  readonly itemSparseResolver: RequestResolver.RequestResolver<
    GetItemSparse,
    never
  >;
  // By FK (array results)
  readonly itemXItemEffectsResolver: RequestResolver.RequestResolver<
    GetItemXItemEffects,
    never
  >;
  readonly manifestInterfaceDataResolver: RequestResolver.RequestResolver<
    GetManifestInterfaceData,
    never
  >;
  readonly specializationSpellsResolver: RequestResolver.RequestResolver<
    GetSpecializationSpells,
    never
  >;
  // By SpellID (FK, single result)
  readonly spellAuraOptionsResolver: RequestResolver.RequestResolver<
    GetSpellAuraOptions,
    never
  >;
  readonly spellAuraRestrictionsResolver: RequestResolver.RequestResolver<
    GetSpellAuraRestrictions,
    never
  >;
  readonly spellCastingRequirementsResolver: RequestResolver.RequestResolver<
    GetSpellCastingRequirements,
    never
  >;
  readonly spellCastTimesResolver: RequestResolver.RequestResolver<
    GetSpellCastTimes,
    never
  >;
  readonly spellCategoriesResolver: RequestResolver.RequestResolver<
    GetSpellCategories,
    never
  >;
  readonly spellCategoryResolver: RequestResolver.RequestResolver<
    GetSpellCategory,
    never
  >;
  readonly spellClassOptionsResolver: RequestResolver.RequestResolver<
    GetSpellClassOptions,
    never
  >;
  readonly spellCooldownsResolver: RequestResolver.RequestResolver<
    GetSpellCooldowns,
    never
  >;
  readonly spellDescriptionVariablesResolver: RequestResolver.RequestResolver<
    GetSpellDescriptionVariables,
    never
  >;
  readonly spellDurationResolver: RequestResolver.RequestResolver<
    GetSpellDuration,
    never
  >;
  readonly spellEffectsResolver: RequestResolver.RequestResolver<
    GetSpellEffects,
    never
  >;
  readonly spellEmpowerResolver: RequestResolver.RequestResolver<
    GetSpellEmpower,
    never
  >;

  readonly spellEmpowerStagesResolver: RequestResolver.RequestResolver<
    GetSpellEmpowerStages,
    never
  >;
  readonly spellInterruptsResolver: RequestResolver.RequestResolver<
    GetSpellInterrupts,
    never
  >;
  readonly spellLearnSpellResolver: RequestResolver.RequestResolver<
    GetSpellLearnSpell,
    never
  >;
  readonly spellLevelsResolver: RequestResolver.RequestResolver<
    GetSpellLevels,
    never
  >;
  readonly spellMiscResolver: RequestResolver.RequestResolver<
    GetSpellMisc,
    never
  >;
  readonly spellNameResolver: RequestResolver.RequestResolver<
    GetSpellName,
    never
  >;
  readonly spellPowerResolver: RequestResolver.RequestResolver<
    GetSpellPower,
    never
  >;
  readonly spellProcsPerMinuteModsResolver: RequestResolver.RequestResolver<
    GetSpellProcsPerMinuteMods,
    never
  >;
  readonly spellProcsPerMinuteResolver: RequestResolver.RequestResolver<
    GetSpellProcsPerMinute,
    never
  >;
  readonly spellRadiusResolver: RequestResolver.RequestResolver<
    GetSpellRadius,
    never
  >;
  readonly spellRangeResolver: RequestResolver.RequestResolver<
    GetSpellRange,
    never
  >;
  readonly spellReplacementResolver: RequestResolver.RequestResolver<
    GetSpellReplacement,
    never
  >;

  readonly spellResolver: RequestResolver.RequestResolver<GetSpell, never>;

  readonly spellShapeshiftFormResolver: RequestResolver.RequestResolver<
    GetSpellShapeshiftForm,
    never
  >;
  readonly spellShapeshiftResolver: RequestResolver.RequestResolver<
    GetSpellShapeshift,
    never
  >;
  readonly spellTargetRestrictionsResolver: RequestResolver.RequestResolver<
    GetSpellTargetRestrictions,
    never
  >;
  readonly spellTotemsResolver: RequestResolver.RequestResolver<
    GetSpellTotems,
    never
  >;
  readonly spellXDescriptionVariablesResolver: RequestResolver.RequestResolver<
    GetSpellXDescriptionVariables,
    never
  >;
  readonly traitDefinitionResolver: RequestResolver.RequestResolver<
    GetTraitDefinition,
    never
  >;
  readonly traitEdgesForTreeResolver: RequestResolver.RequestResolver<
    GetTraitEdgesForTree,
    never
  >;
  readonly traitNodeEntryResolver: RequestResolver.RequestResolver<
    GetTraitNodeEntry,
    never
  >;
  readonly traitNodeGroupXTraitCostResolver: RequestResolver.RequestResolver<
    GetTraitNodeGroupXTraitCosts,
    never
  >;
  readonly traitNodeResolver: RequestResolver.RequestResolver<
    GetTraitNode,
    never
  >;
  readonly traitNodesForTreeResolver: RequestResolver.RequestResolver<
    GetTraitNodesForTree,
    never
  >;
  readonly traitNodeXEntriesResolver: RequestResolver.RequestResolver<
    GetTraitNodeXTraitNodeEntries,
    never
  >;
  readonly traitSubTreeResolver: RequestResolver.RequestResolver<
    GetTraitSubTree,
    never
  >;
  readonly traitTreeLoadoutEntriesResolver: RequestResolver.RequestResolver<
    GetTraitTreeLoadoutEntries,
    never
  >;
  readonly traitTreeLoadoutResolver: RequestResolver.RequestResolver<
    GetTraitTreeLoadout,
    never
  >;
  readonly traitTreeResolver: RequestResolver.RequestResolver<
    GetTraitTree,
    never
  >;
  readonly traitTreeXTraitCurrencyResolver: RequestResolver.RequestResolver<
    GetTraitTreeXTraitCurrencies,
    never
  >;

  readonly uiTextureAtlasElementResolver: RequestResolver.RequestResolver<
    GetUiTextureAtlasElement,
    never
  >;
}

export class DbcResolvers extends Context.Tag("@wowlab/services/DbcResolvers")<
  DbcResolvers,
  DbcResolversInterface
>() {}

export const makeDbcResolvers = Effect.gen(function* () {
  const fetcher = yield* DbcBatchFetcher;

  const traitNodeXEntriesResolver = createByFkArrayResolver<
    Schemas.Dbc.TraitNodeXTraitNodeEntryRow,
    "TraitNodeID",
    GetTraitNodeXTraitNodeEntries
  >(fetcher.fetchTraitNodeXEntriesByNodeIds, "TraitNodeID", (r) => r.nodeId);

  const traitNodesForTreeResolver = createByFkArrayResolver<
    Schemas.Dbc.TraitNodeRow,
    "TraitTreeID",
    GetTraitNodesForTree
  >(fetcher.fetchTraitNodesByTreeIds, "TraitTreeID", (r) => r.treeId);

  const traitTreeXTraitCurrencyResolver = createByFkArrayResolver<
    Schemas.Dbc.TraitTreeXTraitCurrencyRow,
    "TraitTreeID",
    GetTraitTreeXTraitCurrencies
  >(
    fetcher.fetchTraitTreeXTraitCurrenciesByTreeIds,
    "TraitTreeID",
    (r) => r.treeId,
  );

  const traitNodeGroupXTraitCostResolver = createByFkArrayResolver<
    Schemas.Dbc.TraitNodeGroupXTraitCostRow,
    "TraitNodeGroupID",
    GetTraitNodeGroupXTraitCosts
  >(
    fetcher.fetchTraitNodeGroupXTraitCostsByGroupIds,
    "TraitNodeGroupID",
    (r) => r.groupId,
  );

  const traitEdgesForTreeResolver = RequestResolver.makeBatched(
    (requests: ReadonlyArray<GetTraitEdgesForTree>) =>
      Effect.gen(function* () {
        const treeIds = [...new Set(requests.map((r) => r.treeId))];
        if (treeIds.length === 0) {
          return;
        }

        const edgesByTree = yield* fetcher.fetchTraitEdgesByTreeIds(treeIds);

        for (const req of requests) {
          yield* Request.completeEffect(
            req,
            Effect.succeed(edgesByTree.get(req.treeId) ?? []),
          );
        }
      }).pipe(
        Effect.catchAll((error) =>
          Effect.forEach(
            requests,
            (req) => Request.completeEffect(req, Effect.fail(error)),
            { discard: true },
          ),
        ),
      ),
  );

  const traitTreeLoadoutResolver = createByFkSingleResolver<
    Schemas.Dbc.TraitTreeLoadoutRow,
    "ChrSpecializationID",
    GetTraitTreeLoadout
  >(
    fetcher.fetchTraitTreeLoadoutsBySpecIds,
    "ChrSpecializationID",
    (r) => r.specId,
  );

  const traitTreeLoadoutEntriesResolver = createByFkArrayResolver<
    Schemas.Dbc.TraitTreeLoadoutEntryRow,
    "TraitTreeLoadoutID",
    GetTraitTreeLoadoutEntries
  >(
    fetcher.fetchTraitTreeLoadoutEntriesByLoadoutIds,
    "TraitTreeLoadoutID",
    (r) => r.loadoutId,
  );

  return {
    // By ID
    chrClassResolver: createByIdResolver<Schemas.Dbc.ChrClassesRow>(
      fetcher.fetchChrClassesByIds,
    ),
    chrSpecializationResolver:
      createByIdResolver<Schemas.Dbc.ChrSpecializationRow>(
        fetcher.fetchChrSpecializationsByIds,
      ),
    difficultyResolver: createByIdResolver<Schemas.Dbc.DifficultyRow>(
      fetcher.fetchDifficultiesByIds,
    ),
    expectedStatModResolver: createByIdResolver<Schemas.Dbc.ExpectedStatModRow>(
      fetcher.fetchExpectedStatModsByIds,
    ),
    itemAppearanceResolver: createByIdResolver<Schemas.Dbc.ItemAppearanceRow>(
      fetcher.fetchItemAppearancesByIds,
    ),
    itemEffectResolver: createByIdResolver<Schemas.Dbc.ItemEffectRow>(
      fetcher.fetchItemEffectsByIds,
    ),
    itemResolver: createByIdResolver<Schemas.Dbc.ItemRow>(
      fetcher.fetchItemsByIds,
    ),
    itemSparseResolver: createByIdResolver<Schemas.Dbc.ItemSparseRow>(
      fetcher.fetchItemSparsesByIds,
    ),
    manifestInterfaceDataResolver:
      createByIdResolver<Schemas.Dbc.ManifestInterfaceDataRow>(
        fetcher.fetchManifestInterfaceDataByIds,
      ),
    spellCastTimesResolver: createByIdResolver<Schemas.Dbc.SpellCastTimesRow>(
      fetcher.fetchSpellCastTimesByIds,
    ),
    spellCategoryResolver: createByIdResolver<Schemas.Dbc.SpellCategoryRow>(
      fetcher.fetchSpellCategoriesByIds,
    ),
    spellDescriptionVariablesResolver:
      createByIdResolver<Schemas.Dbc.SpellDescriptionVariablesRow>(
        fetcher.fetchSpellDescriptionVariablesByIds,
      ),
    spellDurationResolver: createByIdResolver<Schemas.Dbc.SpellDurationRow>(
      fetcher.fetchSpellDurationsByIds,
    ),
    spellNameResolver: createByIdResolver<Schemas.Dbc.SpellNameRow>(
      fetcher.fetchSpellNamesByIds,
    ),
    spellProcsPerMinuteResolver:
      createByIdResolver<Schemas.Dbc.SpellProcsPerMinuteRow>(
        fetcher.fetchSpellProcsPerMinuteByIds,
      ),
    spellRadiusResolver: createByIdResolver<Schemas.Dbc.SpellRadiusRow>(
      fetcher.fetchSpellRadiusByIds,
    ),
    spellRangeResolver: createByIdResolver<Schemas.Dbc.SpellRangeRow>(
      fetcher.fetchSpellRangesByIds,
    ),
    spellResolver: createByIdResolver<Schemas.Dbc.SpellRow>(
      fetcher.fetchSpellsByIds,
    ),
    spellShapeshiftFormResolver:
      createByIdResolver<Schemas.Dbc.SpellShapeshiftFormRow>(
        fetcher.fetchSpellShapeshiftFormsByIds,
      ),
    traitDefinitionResolver: createByIdResolver<Schemas.Dbc.TraitDefinitionRow>(
      fetcher.fetchTraitDefinitionsByIds,
    ),
    traitNodeEntryResolver: createByIdResolver<Schemas.Dbc.TraitNodeEntryRow>(
      fetcher.fetchTraitNodeEntriesByIds,
    ),
    traitNodeResolver: createByIdResolver<Schemas.Dbc.TraitNodeRow>(
      fetcher.fetchTraitNodesByIds,
    ),
    traitSubTreeResolver: createByIdResolver<Schemas.Dbc.TraitSubTreeRow>(
      fetcher.fetchTraitSubTreesByIds,
    ),
    traitTreeResolver: createByIdResolver<Schemas.Dbc.TraitTreeRow>(
      fetcher.fetchTraitTreesByIds,
    ),
    traitTreeXTraitCurrencyResolver,
    uiTextureAtlasElementResolver:
      createByIdResolver<Schemas.Dbc.UiTextureAtlasElementRow>(
        fetcher.fetchUiTextureAtlasElementsByIds,
      ),

    // By SpellID (FK, single result)
    spellAuraOptionsResolver: createByFkSingleResolver<
      Schemas.Dbc.SpellAuraOptionsRow,
      "SpellID",
      GetSpellAuraOptions
    >(fetcher.fetchSpellAuraOptionsBySpellIds, "SpellID", (r) => r.spellId),
    spellAuraRestrictionsResolver: createByFkSingleResolver<
      Schemas.Dbc.SpellAuraRestrictionsRow,
      "SpellID",
      GetSpellAuraRestrictions
    >(
      fetcher.fetchSpellAuraRestrictionsBySpellIds,
      "SpellID",
      (r) => r.spellId,
    ),
    spellCastingRequirementsResolver: createByFkSingleResolver<
      Schemas.Dbc.SpellCastingRequirementsRow,
      "SpellID",
      GetSpellCastingRequirements
    >(
      fetcher.fetchSpellCastingRequirementsBySpellIds,
      "SpellID",
      (r) => r.spellId,
    ),
    spellCategoriesResolver: createByFkSingleResolver<
      Schemas.Dbc.SpellCategoriesRow,
      "SpellID",
      GetSpellCategories
    >(fetcher.fetchSpellCategoriesBySpellIds, "SpellID", (r) => r.spellId),
    spellClassOptionsResolver: createByFkSingleResolver<
      Schemas.Dbc.SpellClassOptionsRow,
      "SpellID",
      GetSpellClassOptions
    >(fetcher.fetchSpellClassOptionsBySpellIds, "SpellID", (r) => r.spellId),
    spellCooldownsResolver: createByFkSingleResolver<
      Schemas.Dbc.SpellCooldownsRow,
      "SpellID",
      GetSpellCooldowns
    >(fetcher.fetchSpellCooldownsBySpellIds, "SpellID", (r) => r.spellId),
    spellEmpowerResolver: createByFkSingleResolver<
      Schemas.Dbc.SpellEmpowerRow,
      "SpellID",
      GetSpellEmpower
    >(fetcher.fetchSpellEmpowerBySpellIds, "SpellID", (r) => r.spellId),
    spellInterruptsResolver: createByFkSingleResolver<
      Schemas.Dbc.SpellInterruptsRow,
      "SpellID",
      GetSpellInterrupts
    >(fetcher.fetchSpellInterruptsBySpellIds, "SpellID", (r) => r.spellId),
    spellMiscResolver: createByFkSingleResolver<
      Schemas.Dbc.SpellMiscRow,
      "SpellID",
      GetSpellMisc
    >(fetcher.fetchSpellMiscBySpellIds, "SpellID", (r) => r.spellId),
    spellReplacementResolver: createByFkSingleResolver<
      Schemas.Dbc.SpellReplacementRow,
      "SpellID",
      GetSpellReplacement
    >(fetcher.fetchSpellReplacementBySpellIds, "SpellID", (r) => r.spellId),
    spellShapeshiftResolver: createByFkSingleResolver<
      Schemas.Dbc.SpellShapeshiftRow,
      "SpellID",
      GetSpellShapeshift
    >(fetcher.fetchSpellShapeshiftBySpellIds, "SpellID", (r) => r.spellId),
    spellTargetRestrictionsResolver: createByFkSingleResolver<
      Schemas.Dbc.SpellTargetRestrictionsRow,
      "SpellID",
      GetSpellTargetRestrictions
    >(
      fetcher.fetchSpellTargetRestrictionsBySpellIds,
      "SpellID",
      (r) => r.spellId,
    ),

    // By ItemID (FK, single result)
    itemModifiedAppearanceResolver: createByFkSingleResolver<
      Schemas.Dbc.ItemModifiedAppearanceRow,
      "ItemID",
      GetItemModifiedAppearance
    >(fetcher.fetchItemModifiedAppearancesByItemIds, "ItemID", (r) => r.itemId),

    // By FK (array results)
    itemXItemEffectsResolver: createByFkArrayResolver<
      Schemas.Dbc.ItemXItemEffectRow,
      "ItemID",
      GetItemXItemEffects
    >(fetcher.fetchItemXItemEffectsByItemIds, "ItemID", (r) => r.itemId),
    specializationSpellsResolver: createByFkArrayResolver<
      Schemas.Dbc.SpecializationSpellsRow,
      "SpecID",
      GetSpecializationSpells
    >(fetcher.fetchSpecializationSpellsBySpecIds, "SpecID", (r) => r.specId),
    spellEffectsResolver: createByFkArrayResolver<
      Schemas.Dbc.SpellEffectRow,
      "SpellID",
      GetSpellEffects
    >(fetcher.fetchSpellEffectsBySpellIds, "SpellID", (r) => r.spellId),
    spellEmpowerStagesResolver: createByFkArrayResolver<
      Schemas.Dbc.SpellEmpowerStageRow,
      "SpellEmpowerID",
      GetSpellEmpowerStages
    >(
      fetcher.fetchSpellEmpowerStagesByEmpowerIds,
      "SpellEmpowerID",
      (r) => r.spellEmpowerId,
    ),
    spellLearnSpellResolver: createByFkArrayResolver<
      Schemas.Dbc.SpellLearnSpellRow,
      "SpellID",
      GetSpellLearnSpell
    >(fetcher.fetchSpellLearnSpellBySpellIds, "SpellID", (r) => r.spellId),
    spellLevelsResolver: createByFkArrayResolver<
      Schemas.Dbc.SpellLevelsRow,
      "SpellID",
      GetSpellLevels
    >(fetcher.fetchSpellLevelsBySpellIds, "SpellID", (r) => r.spellId),
    spellPowerResolver: createByFkArrayResolver<
      Schemas.Dbc.SpellPowerRow,
      "SpellID",
      GetSpellPower
    >(fetcher.fetchSpellPowerBySpellIds, "SpellID", (r) => r.spellId),
    spellProcsPerMinuteModsResolver: createByFkArrayResolver<
      Schemas.Dbc.SpellProcsPerMinuteModRow,
      "SpellProcsPerMinuteID",
      GetSpellProcsPerMinuteMods
    >(
      fetcher.fetchSpellProcsPerMinuteModsByPpmIds,
      "SpellProcsPerMinuteID",
      (r) => r.spellProcsPerMinuteId,
    ),
    spellTotemsResolver: createByFkArrayResolver<
      Schemas.Dbc.SpellTotemsRow,
      "SpellID",
      GetSpellTotems
    >(fetcher.fetchSpellTotemsBySpellIds, "SpellID", (r) => r.spellId),
    spellXDescriptionVariablesResolver: createByFkArrayResolver<
      Schemas.Dbc.SpellXDescriptionVariablesRow,
      "SpellID",
      GetSpellXDescriptionVariables
    >(
      fetcher.fetchSpellXDescriptionVariablesBySpellIds,
      "SpellID",
      (r) => r.spellId,
    ),
    traitEdgesForTreeResolver,
    traitNodesForTreeResolver,
    traitNodeXEntriesResolver,
    traitNodeGroupXTraitCostResolver,
    traitTreeLoadoutEntriesResolver,
    traitTreeLoadoutResolver,
  } satisfies DbcResolversInterface;
});
