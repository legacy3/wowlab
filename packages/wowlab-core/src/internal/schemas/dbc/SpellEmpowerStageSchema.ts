import * as Schema from "effect/Schema";

export const SpellEmpowerStageRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  Stage: Schema.NumberFromString,
  DurationMs: Schema.NumberFromString,
  SpellEmpowerID: Schema.NumberFromString,
});

export type SpellEmpowerStageRow = Schema.Schema.Type<
  typeof SpellEmpowerStageRowSchema
>;
