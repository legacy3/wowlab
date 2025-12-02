import * as Schema from "effect/Schema";

export const SpellDescriptionVariablesRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  Variables: Schema.String,
});

export type SpellDescriptionVariablesRow = Schema.Schema.Type<
  typeof SpellDescriptionVariablesRowSchema
>;
