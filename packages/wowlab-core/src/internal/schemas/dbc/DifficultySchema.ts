import * as Schema from "effect/Schema";

export const DifficultyRowSchema = Schema.Struct({
  FallbackDifficultyID: Schema.Number,
  Field_1_15_4_56400_013: Schema.optional(Schema.Number),
  Flags: Schema.Number,
  GroupSizeDmgCurveID: Schema.Number,
  GroupSizeHealthCurveID: Schema.Number,
  GroupSizeSpellPointsCurveID: Schema.Number,
  ID: Schema.Number,
  InstanceType: Schema.Number,
  ItemContext: Schema.Number,
  MaxPlayers: Schema.Number,
  MinPlayers: Schema.Number,
  Name_lang: Schema.String,
  OldEnumValue: Schema.Number,
  OrderIndex: Schema.Number,
  ToggleDifficultyID: Schema.Number,
});

export type DifficultyRow = Schema.Schema.Type<typeof DifficultyRowSchema>;
