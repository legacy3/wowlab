import * as Schemas from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import type { DbcCache } from "../DbcCache.js";

import { DbcService, type DbcServiceInterface } from "./DbcService.js";

export const InMemoryDbcService = (cache: DbcCache): Layer.Layer<DbcService> =>
  Layer.succeed(DbcService, {
    getChrClass: (id) => Effect.succeed(cache.chrClasses.get(id)),

    getChrClasses: () => Effect.succeed([...cache.chrClasses.values()]),

    getChrSpecialization: (id) =>
      Effect.succeed(cache.chrSpecialization.get(id)),

    getChrSpecializations: () =>
      Effect.succeed([...cache.chrSpecialization.values()]),

    getContentTuningXExpected: (contentTuningId, mythicPlusSeasonId) =>
      Effect.succeed(
        cache.contentTuningXExpected.filter(
          (x) =>
            x.ContentTuningID === contentTuningId &&
            (x.MinMythicPlusSeasonID === 0 ||
              mythicPlusSeasonId >= x.MinMythicPlusSeasonID) &&
            (x.MaxMythicPlusSeasonID === 0 ||
              mythicPlusSeasonId < x.MaxMythicPlusSeasonID),
        ),
      ),

    getDifficulty: (id) => Effect.succeed(cache.difficulty.get(id)),

    getDifficultyChain: (id) =>
      Effect.sync(() => {
        const chain: Schemas.Dbc.DifficultyRow[] = [];
        let currentId = id;

        while (currentId !== 0) {
          const row = cache.difficulty.get(currentId);
          if (!row) {
            break;
          }

          chain.push(row);
          currentId = row.FallbackDifficultyID ?? 0;
        }

        return chain;
      }),

    getExpectedStatMod: (id) => Effect.succeed(cache.expectedStatMod.get(id)),

    getExpectedStats: (level, expansion) =>
      Effect.succeed(
        cache.expectedStat.filter(
          (stat) =>
            stat.Lvl === level &&
            (stat.ExpansionID === expansion || stat.ExpansionID === -2),
        ),
      ),

    getItem: (itemId) => Effect.succeed(cache.item.get(itemId)),

    getItemAppearance: (id) => Effect.succeed(cache.itemAppearance.get(id)),

    getItemEffect: (id) => Effect.succeed(cache.itemEffect.get(id)),

    getItemModifiedAppearance: (itemId) =>
      Effect.succeed(cache.itemModifiedAppearance.get(itemId)),

    getItemSparse: (itemId) => Effect.succeed(cache.itemSparse.get(itemId)),

    getItemXItemEffects: (itemId) =>
      Effect.succeed(cache.itemXItemEffect.get(itemId) ?? []),

    getManifestInterfaceData: (id) =>
      Effect.succeed(cache.manifestInterfaceData.get(id)),

    getSpecializationSpells: (specId) =>
      Effect.succeed(cache.specializationSpells.get(specId) ?? []),

    getSpell: (spellId) => Effect.succeed(cache.spell.get(spellId)),

    getSpellAuraOptions: (spellId) =>
      Effect.succeed(cache.spellAuraOptions.get(spellId)),

    getSpellAuraRestrictions: (spellId) =>
      Effect.succeed(cache.spellAuraRestrictions.get(spellId)),

    getSpellCastingRequirements: (spellId) =>
      Effect.succeed(cache.spellCastingRequirements.get(spellId)),

    getSpellCastTimes: (id) => Effect.succeed(cache.spellCastTimes.get(id)),

    getSpellCategories: (spellId) =>
      Effect.succeed(cache.spellCategories.get(spellId)),

    getSpellCategory: (id) => Effect.succeed(cache.spellCategory.get(id)),

    getSpellClassOptions: (spellId) =>
      Effect.succeed(cache.spellClassOptions.get(spellId)),

    getSpellCooldowns: (spellId) =>
      Effect.succeed(cache.spellCooldowns.get(spellId)),

    getSpellDescriptionVariables: (id) =>
      Effect.succeed(cache.spellDescriptionVariables.get(id)),

    getSpellDuration: (id) => Effect.succeed(cache.spellDuration.get(id)),

    getSpellEffects: (spellId) =>
      Effect.succeed(cache.spellEffect.get(spellId) ?? []),

    getSpellEmpower: (spellId) =>
      Effect.succeed(cache.spellEmpower.get(spellId)),

    getSpellEmpowerStages: (spellEmpowerId) =>
      Effect.succeed(cache.spellEmpowerStage.get(spellEmpowerId) ?? []),

    getSpellInterrupts: (spellId) =>
      Effect.succeed(cache.spellInterrupts.get(spellId)),

    getSpellLearnSpell: (spellId) =>
      Effect.succeed(cache.spellLearnSpell.get(spellId) ?? []),

    getSpellLevels: (spellId) =>
      Effect.succeed(cache.spellLevels.get(spellId) ?? []),

    getSpellMisc: (spellId) => Effect.succeed(cache.spellMisc.get(spellId)),

    getSpellName: (spellId) => Effect.succeed(cache.spellName.get(spellId)),

    getSpellPower: (spellId) =>
      Effect.succeed(cache.spellPower.get(spellId) ?? []),

    getSpellProcsPerMinute: (id) =>
      Effect.succeed(cache.spellProcsPerMinute.get(id)),

    getSpellProcsPerMinuteMods: (spellProcsPerMinuteId) =>
      Effect.succeed(
        cache.spellProcsPerMinuteMod.get(spellProcsPerMinuteId) ?? [],
      ),

    getSpellRadius: (id) => Effect.succeed(cache.spellRadius.get(id)),

    getSpellRange: (id) => Effect.succeed(cache.spellRange.get(id)),

    getSpellReplacement: (spellId) =>
      Effect.succeed(cache.spellReplacement.get(spellId)),

    getSpellShapeshift: (spellId) =>
      Effect.succeed(cache.spellShapeshift.get(spellId)),

    getSpellShapeshiftForm: (id) =>
      Effect.succeed(cache.spellShapeshiftForm.get(id)),

    getSpellTargetRestrictions: (spellId) =>
      Effect.succeed(cache.spellTargetRestrictions.get(spellId)),

    getSpellTotems: (spellId) =>
      Effect.succeed(cache.spellTotems.get(spellId) ?? []),

    getSpellXDescriptionVariables: (spellId) =>
      Effect.succeed(cache.spellXDescriptionVariables.get(spellId) ?? []),

    getTraitDefinition: (id) => Effect.succeed(cache.traitDefinition.get(id)),

    getTraitEdgesForTree: (treeId) =>
      Effect.succeed(cache.traitEdge.get(treeId) ?? []),

    getTraitNode: (id) => Effect.succeed(cache.traitNode.get(id)),

    getTraitNodeEntry: (id) => Effect.succeed(cache.traitNodeEntry.get(id)),

    getTraitNodesForTree: (treeId) =>
      Effect.succeed(cache.traitNodesByTree.get(treeId) ?? []),

    getTraitNodeXTraitNodeEntries: (nodeId) =>
      Effect.succeed(cache.traitNodeXTraitNodeEntry.get(nodeId) ?? []),

    getTraitSubTree: (id) => Effect.succeed(cache.traitSubTree.get(id)),

    getTraitTree: (id) => Effect.succeed(cache.traitTree.get(id)),

    getTraitTreeLoadout: (specId) =>
      Effect.succeed(cache.traitTreeLoadout.get(specId)),

    getTraitTreeLoadoutEntries: (loadoutId) =>
      Effect.succeed(cache.traitTreeLoadoutEntry.get(loadoutId) ?? []),
  } satisfies DbcServiceInterface);
