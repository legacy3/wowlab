import * as Schema from "effect/Schema";

export const CurvePointRowSchema = Schema.Struct({
  Pos_0: Schema.NumberFromString,
  Pos_1: Schema.NumberFromString,
  PosPreSquish_0: Schema.NumberFromString,
  PosPreSquish_1: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  CurveID: Schema.NumberFromString,
  OrderIndex: Schema.NumberFromString,
});

export type CurvePointRow = Schema.Schema.Type<typeof CurvePointRowSchema>;
