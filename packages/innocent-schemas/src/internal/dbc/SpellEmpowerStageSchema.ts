import * as Schema from "effect/Schema";

const SpellEmpowerStageSchema = Schema.Struct({
  DurationMs: Schema.Number,
  ID: Schema.Number,
  SpellEmpowerID: Schema.Number,
  Stage: Schema.Number,
});

type SpellEmpowerStageRow = Schema.Schema.Type<typeof SpellEmpowerStageSchema>;

export { SpellEmpowerStageSchema, type SpellEmpowerStageRow };
