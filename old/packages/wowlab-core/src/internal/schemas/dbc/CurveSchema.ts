import * as Schema from "effect/Schema";

export const CurveRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  Type: Schema.NumberFromString,
  Flags: Schema.NumberFromString,
});

export type CurveRow = Schema.Schema.Type<typeof CurveRowSchema>;
