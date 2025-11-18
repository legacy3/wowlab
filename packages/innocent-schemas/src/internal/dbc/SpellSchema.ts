import * as Schema from "effect/Schema";

import * as Branded from "@/Branded";

const SpellSchema = Schema.Struct({
  AuraDescription: Schema.String,
  Description: Schema.String,
  ID: Branded.SpellIDSchema,
  NameSubtext: Schema.String,
});

type SpellRow = Schema.Schema.Type<typeof SpellSchema>;

export { SpellSchema, type SpellRow };
