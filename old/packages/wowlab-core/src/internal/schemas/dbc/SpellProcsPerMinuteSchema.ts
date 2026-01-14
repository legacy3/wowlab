import * as Schema from "effect/Schema";

export const SpellProcsPerMinuteRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  BaseProcRate: Schema.NumberFromString,
  Flags: Schema.NumberFromString,
});

export type SpellProcsPerMinuteRow = Schema.Schema.Type<
  typeof SpellProcsPerMinuteRowSchema
>;
