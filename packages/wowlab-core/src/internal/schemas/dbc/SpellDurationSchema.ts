import * as Schema from "effect/Schema";

export const SpellDurationRowSchema = Schema.Struct({
  Duration: Schema.Number,
  ID: Schema.Number,
  MaxDuration: Schema.Number,
});

export type SpellDurationRow = Schema.Schema.Type<
  typeof SpellDurationRowSchema
>;
