import * as Schema from "effect/Schema";

export const DifficultyRowSchema = Schema.Struct({
  FallbackDifficultyID: Schema.NumberFromString,
  Field_1_15_4_56400_013: Schema.optional(Schema.NumberFromString),
  Flags: Schema.NumberFromString,
  GroupSizeDmgCurveID: Schema.NumberFromString,
  GroupSizeHealthCurveID: Schema.NumberFromString,
  GroupSizeSpellPointsCurveID: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  InstanceType: Schema.NumberFromString,
  ItemContext: Schema.NumberFromString,
  MaxPlayers: Schema.NumberFromString,
  MinPlayers: Schema.NumberFromString,
  Name_lang: Schema.String,
  OldEnumValue: Schema.NumberFromString,
  OrderIndex: Schema.NumberFromString,
  ToggleDifficultyID: Schema.NumberFromString,
});

export type DifficultyRow = Schema.Schema.Type<typeof DifficultyRowSchema>;
