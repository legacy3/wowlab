import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellEmpowerRowSchema = Schema.Struct({
  Field_10_0_0_44649_002: Schema.Number,
  ID: Schema.Number,
  SpellID: Branded.SpellIDSchema,
});

export type SpellEmpowerRow = Schema.Schema.Type<typeof SpellEmpowerRowSchema>;
