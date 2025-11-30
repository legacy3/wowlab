import * as Schema from "effect/Schema";

export const SpellEmpowerStageRowSchema = Schema.Struct({
  DurationMs: Schema.Number,
  ID: Schema.Number,
  SpellEmpowerID: Schema.Number,
  Stage: Schema.Number,
});

export type SpellEmpowerStageRow = Schema.Schema.Type<
  typeof SpellEmpowerStageRowSchema
>;
