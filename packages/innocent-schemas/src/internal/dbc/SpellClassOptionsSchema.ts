import * as Schema from "effect/Schema";

import * as Branded from "@/Branded";

const SpellClassOptionsSchema = Schema.Struct({
  ID: Schema.Number,
  ModalNextSpell: Schema.Number,
  SpellClassMask: Schema.Array(Schema.Number),
  SpellClassSet: Schema.Number,
  SpellID: Branded.SpellIDSchema,
});

type SpellClassOptionsRow = Schema.Schema.Type<typeof SpellClassOptionsSchema>;

export { SpellClassOptionsSchema, type SpellClassOptionsRow };
