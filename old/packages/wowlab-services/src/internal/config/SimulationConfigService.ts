/**
 * SimulationConfigService
 *
 * Provides access to simulation configuration including aura data.
 * Per docs/aura-system/05-phase3-handler-integration.md: config.auras supplies static data
 */
import type { Aura, Branded, Spell } from "@wowlab/core/Schemas";

import * as Effect from "effect/Effect";
import * as Ref from "effect/Ref";

/**
 * Simulation configuration structure
 * Per docs/aura-system/07-phase5-simulation-setup.md
 */
export interface SimulationConfig {
  /** Aura static config by spell ID */
  readonly auras: ReadonlyMap<Branded.SpellID, Aura.AuraDataFlat>;

  /** Spell static config by spell ID */
  readonly spells: ReadonlyMap<Branded.SpellID, Spell.SpellDataFlat>;
}

const createEmptyConfig = (): SimulationConfig => ({
  auras: new Map(),
  spells: new Map(),
});

export class SimulationConfigService extends Effect.Service<SimulationConfigService>()(
  "SimulationConfigService",
  {
    effect: Effect.gen(function* () {
      const ref = yield* Ref.make<SimulationConfig>(createEmptyConfig());

      return {
        /**
         * Get the current simulation config
         */
        getConfig: () => Ref.get(ref),

        /**
         * Get aura config by spell ID
         */
        getAuraConfig: (
          spellId: Branded.SpellID,
        ): Effect.Effect<Aura.AuraDataFlat | undefined> =>
          Effect.gen(function* () {
            const config = yield* Ref.get(ref);
            return config.auras.get(spellId);
          }),

        /**
         * Get spell config by spell ID
         */
        getSpellConfig: (
          spellId: Branded.SpellID,
        ): Effect.Effect<Spell.SpellDataFlat | undefined> =>
          Effect.gen(function* () {
            const config = yield* Ref.get(ref);
            return config.spells.get(spellId);
          }),

        /**
         * Set the simulation config
         */
        setConfig: (config: SimulationConfig) => Ref.set(ref, config),

        /**
         * Update the simulation config
         */
        updateConfig: (fn: (config: SimulationConfig) => SimulationConfig) =>
          Ref.update(ref, fn),
      };
    }),
  },
) {}
