import * as Schema from "effect/Schema";
import * as Branded from "../Branded.js";

export const SpellNameRowSchema = Schema.Struct({
  ID: Branded.SpellIDSchema,
  Name_lang: Schema.String,
});

export type SpellNameRow = Schema.Schema.Type<typeof SpellNameRowSchema>;
