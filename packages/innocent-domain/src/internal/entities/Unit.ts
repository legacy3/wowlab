import * as Branded from "@packages/innocent-schemas/Branded";
import { Map } from "immutable";

import type { Aura } from "./Aura";
import type { Spell } from "./Spell";

import { PaperDoll } from "./PaperDoll";
import { Power } from "./Power";
import { ALL_POWER_TYPES, EntityCollection, Position, PowerKey } from "./types";

export type AuraCollection = EntityCollection<
  Aura,
  AuraCollectionMeta,
  Branded.SpellID
>;

export interface AuraCollectionMeta {
  // Reserved for future metadata
}

export type SpellCollection = EntityCollection<
  Spell,
  SpellCollectionMeta,
  Branded.SpellID
>;

export interface SpellCollectionMeta {
  readonly cooldownCategories: Map<number, number>;
}

export interface Unit {
  readonly auras: AuraCollection;
  readonly castingSpellId: Branded.SpellID | null;
  readonly castRemaining: number;
  readonly castTarget: Branded.UnitID | null;
  // Health (separate from power resources)
  readonly health: Power;

  readonly id: Branded.UnitID;

  readonly isCasting: boolean;

  readonly isPlayer: boolean; // Flag to identify player vs enemy/ally
  readonly name: string;
  // Paper doll for stat management (stats, class, level, etc.)
  readonly paperDoll: PaperDoll;

  readonly position: Position;

  // All power types in a Map keyed by PowerKey
  readonly power: Map<PowerKey, Power>;
  readonly profiles: readonly string[];
  readonly spells: SpellCollection;
}

function createPowerMap(): Map<PowerKey, Power> {
  let powerMap = Map<PowerKey, Power>();

  for (const powerType of ALL_POWER_TYPES) {
    powerMap = powerMap.set(powerType, Power.create({ current: 0, max: 0 }));
  }

  return powerMap;
}

export const createNotFoundUnit = (id: Branded.UnitID): Unit => {
  const spells: SpellCollection = {
    all: Map<Branded.SpellID, Spell>(),
    meta: {
      cooldownCategories: Map<number, number>(),
    },
  };

  const auras: AuraCollection = {
    all: Map<Branded.SpellID, Aura>(),
    meta: {},
  };

  const paperDoll = PaperDoll.create({
    armor: 0,
    avoidance: 0,
    class: "Unknown",
    critRating: 0,
    hasteRating: 0,
    level: 0,
    mainStat: 0,
    masteryPercent: 0,
    stamina: 0,
    versatilityRating: 0,
  });

  return {
    auras,
    castingSpellId: null,
    castRemaining: 0,
    castTarget: null,
    health: Power.create({ current: 0, max: 1 }),
    id,
    isCasting: false,
    isPlayer: false,
    name: `Not Found (${id})`,
    paperDoll,
    position: { x: 0, y: 0, z: 0 },
    power: createPowerMap(),
    profiles: [],
    spells,
  };
};
