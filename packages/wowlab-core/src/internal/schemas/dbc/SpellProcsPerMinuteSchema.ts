import * as Schema from "effect/Schema";

export const SpellProcsPerMinuteRowSchema = Schema.Struct({
  BaseProcRate: Schema.NumberFromString,
  Flags: Schema.NumberFromString,
  ID: Schema.NumberFromString,
});

export type SpellProcsPerMinuteRow = Schema.Schema.Type<
  typeof SpellProcsPerMinuteRowSchema
>;
