import * as Schema from "effect/Schema";

export const SpellProcsPerMinuteRowSchema = Schema.Struct({
  BaseProcRate: Schema.Number,
  Flags: Schema.Number,
  ID: Schema.Number,
});

export type SpellProcsPerMinuteRow = Schema.Schema.Type<
  typeof SpellProcsPerMinuteRowSchema
>;
