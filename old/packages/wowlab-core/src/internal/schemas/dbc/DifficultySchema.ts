import * as Schema from "effect/Schema";

export const DifficultyRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  Name_lang: Schema.String,
  InstanceType: Schema.NumberFromString,
  OrderIndex: Schema.NumberFromString,
  OldEnumValue: Schema.NumberFromString,
  FallbackDifficultyID: Schema.NumberFromString,
  MinPlayers: Schema.NumberFromString,
  MaxPlayers: Schema.NumberFromString,
  Flags: Schema.NumberFromString,
  ItemContext: Schema.NumberFromString,
  ToggleDifficultyID: Schema.NumberFromString,
  GroupSizeHealthCurveID: Schema.NumberFromString,
  GroupSizeDmgCurveID: Schema.NumberFromString,
  GroupSizeSpellPointsCurveID: Schema.NumberFromString,
  Field_1_15_4_56400_013: Schema.optional(Schema.NumberFromString),
});

export type DifficultyRow = Schema.Schema.Type<typeof DifficultyRowSchema>;
