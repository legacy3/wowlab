import * as Schema from "effect/Schema";

export const GlobalCurveRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  CurveID: Schema.NumberFromString,
  Type: Schema.NumberFromString,
});

export type GlobalCurveRow = Schema.Schema.Type<typeof GlobalCurveRowSchema>;
