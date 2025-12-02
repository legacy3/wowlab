import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellXDescriptionVariablesRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  SpellDescriptionVariablesID: Schema.NumberFromString,
  SpellID: Branded.SpellIDSchema,
});

export type SpellXDescriptionVariablesRow = Schema.Schema.Type<
  typeof SpellXDescriptionVariablesRowSchema
>;
