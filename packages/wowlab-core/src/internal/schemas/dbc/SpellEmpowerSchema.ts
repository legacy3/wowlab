import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellEmpowerRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  SpellID: Branded.SpellIDSchema,
  Field_10_0_0_44649_002: Schema.NumberFromString,
});

export type SpellEmpowerRow = Schema.Schema.Type<typeof SpellEmpowerRowSchema>;
