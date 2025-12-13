import * as Schema from "effect/Schema";

export const RandPropPointsRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  DamageReplaceStatF: Schema.NumberFromString,
  DamageSecondaryF: Schema.NumberFromString,
  DamageReplaceStat: Schema.NumberFromString,
  DamageSecondary: Schema.NumberFromString,
  EpicF_0: Schema.NumberFromString,
  EpicF_1: Schema.NumberFromString,
  EpicF_2: Schema.NumberFromString,
  EpicF_3: Schema.NumberFromString,
  EpicF_4: Schema.NumberFromString,
  SuperiorF_0: Schema.NumberFromString,
  SuperiorF_1: Schema.NumberFromString,
  SuperiorF_2: Schema.NumberFromString,
  SuperiorF_3: Schema.NumberFromString,
  SuperiorF_4: Schema.NumberFromString,
  GoodF_0: Schema.NumberFromString,
  GoodF_1: Schema.NumberFromString,
  GoodF_2: Schema.NumberFromString,
  GoodF_3: Schema.NumberFromString,
  GoodF_4: Schema.NumberFromString,
  Epic_0: Schema.NumberFromString,
  Epic_1: Schema.NumberFromString,
  Epic_2: Schema.NumberFromString,
  Epic_3: Schema.NumberFromString,
  Epic_4: Schema.NumberFromString,
  Superior_0: Schema.NumberFromString,
  Superior_1: Schema.NumberFromString,
  Superior_2: Schema.NumberFromString,
  Superior_3: Schema.NumberFromString,
  Superior_4: Schema.NumberFromString,
  Good_0: Schema.NumberFromString,
  Good_1: Schema.NumberFromString,
  Good_2: Schema.NumberFromString,
  Good_3: Schema.NumberFromString,
  Good_4: Schema.NumberFromString,
});

export type RandPropPointsRow = Schema.Schema.Type<
  typeof RandPropPointsRowSchema
>;
