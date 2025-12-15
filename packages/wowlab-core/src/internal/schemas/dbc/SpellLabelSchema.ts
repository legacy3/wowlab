import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellLabelRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  LabelID: Schema.NumberFromString,
  SpellID: Branded.SpellIDSchema,
});

export type SpellLabelRow = Schema.Schema.Type<typeof SpellLabelRowSchema>;
