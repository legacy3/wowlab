import * as Schema from "effect/Schema";

export const SpellDurationRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  Duration: Schema.NumberFromString,
  MaxDuration: Schema.NumberFromString,
});

export type SpellDurationRow = Schema.Schema.Type<
  typeof SpellDurationRowSchema
>;
