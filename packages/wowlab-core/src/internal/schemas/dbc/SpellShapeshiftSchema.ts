import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellShapeshiftRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  ShapeshiftExclude_0: Schema.NumberFromString,
  ShapeshiftExclude_1: Schema.NumberFromString,
  ShapeshiftMask_0: Schema.NumberFromString,
  ShapeshiftMask_1: Schema.NumberFromString,
  SpellID: Branded.SpellIDSchema,
  StanceBarOrder: Schema.NumberFromString,
});

export type SpellShapeshiftRow = Schema.Schema.Type<
  typeof SpellShapeshiftRowSchema
>;
