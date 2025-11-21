import * as Schema from "effect/Schema";

export const SpellDurationRowSchema = Schema.Struct({
  ID: Schema.Number,
  Duration: Schema.Number,
  MaxDuration: Schema.Number,
});

export type SpellDurationRow = Schema.Schema.Type<
  typeof SpellDurationRowSchema
>;
