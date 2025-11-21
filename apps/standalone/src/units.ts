import * as Entities from "@wowlab/core/Entities";
import * as Schemas from "@wowlab/core/Schemas";
import { Map, Record } from "immutable";

export const createPlayerUnit = (): Entities.Unit.Unit =>
  Entities.Unit.Unit.create({
    auras: {
      all: Map<Schemas.Branded.SpellID, Entities.Aura.Aura>(),
      meta: Record({})(),
    },
    castingSpellId: null,
    castRemaining: 0,
    castTarget: Schemas.Branded.UnitID("enemy"),
    health: Entities.Power.Power.create({ current: 25000, max: 25000 }),
    id: Schemas.Branded.UnitID("player"),
    isCasting: false,
    isPlayer: true,
    name: "Player",
    paperDoll: Entities.PaperDoll.PaperDoll.create({
      armor: 0,
      avoidance: 0,
      class: "Mage",
      critRating: 0,
      hasteRating: 0,
      level: 80,
      mainStat: 0,
      masteryPercent: 0,
      stamina: 0,
      versatilityRating: 0,
    }),
    position: Entities.Position.Position.create({ x: 0, y: 0 }),
    power: Map<Schemas.Enums.PowerType, Entities.Power.Power>([
      [
        Schemas.Enums.PowerType.Mana,
        Entities.Power.Power.create({ current: 15000, max: 15000 }),
      ],
      [
        Schemas.Enums.PowerType.Rage,
        Entities.Power.Power.create({ current: 0, max: 100 }),
      ],
      [
        Schemas.Enums.PowerType.Focus,
        Entities.Power.Power.create({ current: 100, max: 100 }),
      ],
      [
        Schemas.Enums.PowerType.Energy,
        Entities.Power.Power.create({ current: 100, max: 100 }),
      ],
      [
        Schemas.Enums.PowerType.ComboPoints,
        Entities.Power.Power.create({ current: 0, max: 5 }),
      ],
      [
        Schemas.Enums.PowerType.Runes,
        Entities.Power.Power.create({ current: 6, max: 6 }),
      ],
      [
        Schemas.Enums.PowerType.RunicPower,
        Entities.Power.Power.create({ current: 0, max: 100 }),
      ],
      [
        Schemas.Enums.PowerType.SoulShards,
        Entities.Power.Power.create({ current: 3, max: 5 }),
      ],
      [
        Schemas.Enums.PowerType.LunarPower,
        Entities.Power.Power.create({ current: 0, max: 100 }),
      ],
      [
        Schemas.Enums.PowerType.HolyPower,
        Entities.Power.Power.create({ current: 0, max: 5 }),
      ],
      [
        Schemas.Enums.PowerType.Alternate,
        Entities.Power.Power.create({ current: 0, max: 100 }),
      ],
      [
        Schemas.Enums.PowerType.Maelstrom,
        Entities.Power.Power.create({ current: 0, max: 100 }),
      ],
      [
        Schemas.Enums.PowerType.Chi,
        Entities.Power.Power.create({ current: 0, max: 6 }),
      ],
      [
        Schemas.Enums.PowerType.Insanity,
        Entities.Power.Power.create({ current: 0, max: 100 }),
      ],
      [
        Schemas.Enums.PowerType.BurningEmbers,
        Entities.Power.Power.create({ current: 0, max: 0 }),
      ],
      [
        Schemas.Enums.PowerType.DemonicFury,
        Entities.Power.Power.create({ current: 0, max: 0 }),
      ],
      [
        Schemas.Enums.PowerType.ArcaneCharges,
        Entities.Power.Power.create({ current: 0, max: 4 }),
      ],
      [
        Schemas.Enums.PowerType.Fury,
        Entities.Power.Power.create({ current: 0, max: 100 }),
      ],
      [
        Schemas.Enums.PowerType.Pain,
        Entities.Power.Power.create({ current: 0, max: 100 }),
      ],
    ]),
    profiles: ["player-base", "class-mage", "spec-mage-fire"],
    spells: {
      all: Map(),
      meta: Record({ cooldownCategories: Map<number, number>() })({
        cooldownCategories: Map(),
      }),
    },
  });

export const createEnemyUnit = (): Entities.Unit.Unit =>
  Entities.Unit.Unit.create({
    auras: {
      all: Map<Schemas.Branded.SpellID, Entities.Aura.Aura>(),
      meta: Record({})(),
    },
    castingSpellId: null,
    castRemaining: 0,
    castTarget: null,
    health: Entities.Power.Power.create({ current: 100000, max: 100000 }),
    id: Schemas.Branded.UnitID("enemy"),
    isCasting: false,
    isPlayer: false,
    name: "Target Dummy",
    paperDoll: Entities.PaperDoll.PaperDoll.create({
      armor: 0,
      avoidance: 0,
      class: "Warrior",
      critRating: 0,
      hasteRating: 0,
      level: 83,
      mainStat: 0,
      masteryPercent: 0,
      stamina: 0,
      versatilityRating: 0,
    }),
    position: Entities.Position.Position.create({ x: 10, y: 0 }),
    power: Map(),
    profiles: ["npc-base"],
    spells: {
      all: Map(),
      meta: Record({ cooldownCategories: Map<number, number>() })({
        cooldownCategories: Map(),
      }),
    },
  });
