import type { DbcError } from "@wowlab/core/Errors";
import type * as Errors from "@wowlab/core/Errors";
import type { Aura, Branded, Spell } from "@wowlab/core/Schemas";

import * as Effect from "effect/Effect";
import * as Ref from "effect/Ref";

import type { SimulationConfig } from "../config/SimulationConfigService.js";

import { DbcService } from "../data/dbc/DbcService.js";
import {
  ExtractorService,
  transformAura,
  transformSpell,
} from "../data/transformer/index.js";

export interface ComposedProfile {
  readonly bundles: ReadonlyArray<unknown>;
  readonly signature: string;
}

/**
 * Batch load aura data for a list of spell IDs.
 * Per docs/aura-system/07-phase5-simulation-setup.md:
 * - Batch transformAura for all relevant spellIds
 * - Missing data should not crash setup; they simply omit the aura entry
 */
const loadAuraData = (
  spellIds: ReadonlyArray<number>,
): Effect.Effect<
  ReadonlyMap<Branded.SpellID, Aura.AuraDataFlat>,
  DbcError,
  DbcService | ExtractorService
> =>
  Effect.gen(function* () {
    const auras = new Map<Branded.SpellID, Aura.AuraDataFlat>();

    for (const spellId of spellIds) {
      const result = yield* Effect.either(transformAura(spellId));

      if (result._tag === "Right") {
        auras.set(result.right.spellId, result.right);
      }
      // Missing data does not crash - we just skip
    }

    return auras;
  });

/**
 * Batch load spell data for a list of spell IDs.
 */
const loadSpellData = (
  spellIds: ReadonlyArray<number>,
): Effect.Effect<
  ReadonlyMap<Branded.SpellID, Spell.SpellDataFlat>,
  DbcError,
  DbcService | ExtractorService
> =>
  Effect.gen(function* () {
    const spells = new Map<Branded.SpellID, Spell.SpellDataFlat>();

    for (const spellId of spellIds) {
      const result = yield* Effect.either(transformSpell(spellId));

      if (result._tag === "Right") {
        spells.set(result.right.id, result.right);
      }
    }

    return spells;
  });

// Profile composition service
export class ProfileComposer extends Effect.Service<ProfileComposer>()(
  "ProfileComposer",
  {
    effect: Effect.gen(function* () {
      const cacheRef = yield* Ref.make(new Map<string, ComposedProfile>());

      const compose = (profileIds: ReadonlyArray<string>) =>
        Effect.gen(function* () {
          const signature = profileIds.join(",");
          const cache = yield* Ref.get(cacheRef);
          const cached = cache.get(signature);

          if (cached) {
            return cached;
          }

          // TODO: Load and compose profiles
          const composed: ComposedProfile = { bundles: [], signature };

          yield* Ref.update(cacheRef, (prev) => {
            const next = new Map(prev);
            next.set(signature, composed);

            return next;
          });

          return composed;
        });

      /**
       * Build SimulationConfig from rotation spell IDs.
       * Per docs/aura-system/07-phase5-simulation-setup.md:
       * - Collect spellIds from rotation actions
       * - Batch transformAura and transformSpell for each
       * - Return SimulationConfig { auras, spells }
       */
      const buildSimulationConfig = (
        spellIds: ReadonlyArray<number>,
      ): Effect.Effect<
        SimulationConfig,
        DbcError,
        DbcService | ExtractorService
      > =>
        Effect.gen(function* () {
          // Batch load aura and spell data in parallel
          const [auras, spells] = yield* Effect.all([
            loadAuraData(spellIds),
            loadSpellData(spellIds),
          ]);

          return { auras, spells };
        });

      return {
        buildSimulationConfig,
        compose,
      };
    }),
  },
) {}
