import { DbcError } from "@wowlab/core/Errors";
import * as Schemas from "@wowlab/core/Schemas";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";

export interface DbcServiceInterface {
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

  readonly getItemEffect: (
    id: number,
  ) => Effect.Effect<Schemas.Dbc.ItemEffectRow | undefined, DbcError>;

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
  readonly getSpell: (
    spellId: number,
  ) => Effect.Effect<Schemas.Dbc.SpellRow | undefined, DbcError>;

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

  readonly getSpellDuration: (
    id: number,
  ) => Effect.Effect<Schemas.Dbc.SpellDurationRow | undefined, DbcError>;

  readonly getSpellEffects: (
    spellId: number,
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.SpellEffectRow>, DbcError>;

  readonly getSpellMisc: (
    spellId: number,
  ) => Effect.Effect<Schemas.Dbc.SpellMiscRow | undefined, DbcError>;

  readonly getSpellName: (
    spellId: number,
  ) => Effect.Effect<Schemas.Dbc.SpellNameRow | undefined, DbcError>;

  readonly getSpellPower: (
    spellId: number,
  ) => Effect.Effect<ReadonlyArray<Schemas.Dbc.SpellPowerRow>, DbcError>;

  readonly getSpellRadius: (
    id: number,
  ) => Effect.Effect<Schemas.Dbc.SpellRadiusRow | undefined, DbcError>;

  readonly getSpellRange: (
    id: number,
  ) => Effect.Effect<Schemas.Dbc.SpellRangeRow | undefined, DbcError>;
}

export class DbcService extends Context.Tag("@wowlab/services/DbcService")<
  DbcService,
  DbcServiceInterface
>() {}
