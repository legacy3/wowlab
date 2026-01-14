import { Map, Record } from "immutable";

import * as Branded from "../schemas/Branded.js";
import * as Enums from "../schemas/Enums.js";
import { Aura } from "./Aura.js";
import { PaperDoll } from "./PaperDoll.js";
import { Position } from "./Position.js";
import { Power } from "./Power.js";
import { Spell } from "./Spell.js";

export type AuraCollection = EntityCollection<
  Aura,
  Record<{}>, // Empty meta for now
  Branded.SpellID
>;

// Collections
export interface EntityCollection<T, Meta, ID> {
  readonly all: Map<ID, T>;
  readonly meta: Meta;
}

export type SpellCollection = EntityCollection<
  Spell,
  Record<{ cooldownCategories: Map<number, number> }>,
  Branded.SpellID
>;

// Unit
interface UnitProps {
  readonly auras: AuraCollection;
  readonly castingSpellId: Branded.SpellID | null;
  readonly castRemaining: number;
  readonly castTarget: Branded.UnitID | null;
  readonly health: Power;
  readonly id: Branded.UnitID;
  readonly isCasting: boolean;
  readonly isPlayer: boolean;
  readonly name: string;
  readonly paperDoll: PaperDoll;
  readonly position: Position;
  readonly power: Map<Enums.PowerType, Power>;
  readonly profiles: readonly string[];
  readonly spells: SpellCollection;
}

const UnitRecord = Record<UnitProps>({
  auras: { all: Map(), meta: Record({})() },
  castingSpellId: null,
  castRemaining: 0,
  castTarget: null,
  health: Power.create({ current: 0, max: 1 }),
  id: Branded.UnitID("unknown"),
  isCasting: false,
  isPlayer: false,
  name: "Unknown",
  paperDoll: PaperDoll.create({}),
  position: Position.create({}),
  power: Map(),
  profiles: [],
  spells: {
    all: Map(),
    meta: Record({ cooldownCategories: Map<number, number>() })(),
  },
});

export class Unit extends UnitRecord {
  static create(props: Partial<UnitProps>): Unit {
    return new Unit(props);
  }
}
