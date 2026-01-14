import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellReplacementRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  ReplacementSpellID: Schema.NumberFromString,
  SpellID: Branded.SpellIDSchema,
});

export type SpellReplacementRow = Schema.Schema.Type<
  typeof SpellReplacementRowSchema
>;
