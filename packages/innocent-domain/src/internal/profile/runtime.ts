import * as Branded from "@packages/innocent-schemas/Branded";
import * as Effect from "effect/Effect";

import * as Entities from "@/Entities";
import * as Errors from "@/Errors";

export interface ModifierRuntime {
  readonly combat: ModifierRuntimeCombat;
  readonly log: ModifierRuntimeLog;
  readonly rng: ModifierRuntimeRng;
  readonly spells: ModifierRuntimeSpells;
  readonly state: ModifierRuntimeState;
  readonly units: ModifierRuntimeUnits;
}

export interface ModifierRuntimeCombat {
  readonly rollCrit: (unit: Entities.Unit) => boolean;
}

export interface ModifierRuntimeLog {
  readonly debug: (
    source: string,
    message: string,
    data?: Record<string, unknown>,
  ) => Effect.Effect<void>;
  readonly info: (
    source: string,
    message: string,
    data?: Record<string, unknown>,
  ) => Effect.Effect<void>;
}

export interface ModifierRuntimeRng {
  readonly roll: (chance: number) => Effect.Effect<boolean>;
}

export interface ModifierRuntimeSpells {
  readonly get: (
    unitId: Branded.UnitID,
    spellId: Branded.SpellID,
  ) => Effect.Effect<
    Entities.Spell,
    Errors.UnitNotFound | Errors.SpellNotFound
  >;
  readonly update: (
    unitId: Branded.UnitID,
    spell: Entities.Spell,
  ) => Effect.Effect<void>;
}

export interface ModifierRuntimeState {
  readonly currentTime: () => Effect.Effect<number>;
}

export interface ModifierRuntimeUnits {
  readonly player: () => Effect.Effect<Entities.Unit, Errors.UnitNotFound>;
  readonly update: (unit: Entities.Unit) => Effect.Effect<void>;
}
