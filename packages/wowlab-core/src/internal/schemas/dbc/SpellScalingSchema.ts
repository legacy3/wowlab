import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellScalingRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  SpellID: Branded.SpellIDSchema,
  MinScalingLevel: Schema.NumberFromString,
  MaxScalingLevel: Schema.NumberFromString,
  ScalesFromItemLevel: Schema.NumberFromString,
});

export type SpellScalingRow = Schema.Schema.Type<typeof SpellScalingRowSchema>;
