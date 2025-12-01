import * as Schema from "effect/Schema";

export const SpellEmpowerStageRowSchema = Schema.Struct({
  DurationMs: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  SpellEmpowerID: Schema.NumberFromString,
  Stage: Schema.NumberFromString,
});

export type SpellEmpowerStageRow = Schema.Schema.Type<
  typeof SpellEmpowerStageRowSchema
>;
