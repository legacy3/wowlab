import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellRowSchema = Schema.Struct({
  ID: Branded.SpellIDSchema,
  NameSubtext_lang: Schema.NullOr(Schema.String),
  Description_lang: Schema.NullOr(Schema.String),
  AuraDescription_lang: Schema.NullOr(Schema.String),
});

export type SpellRow = Schema.Schema.Type<typeof SpellRowSchema>;
