import * as Schema from "effect/Schema";

import * as Branded from "@/Branded";

const SpellEmpowerSchema = Schema.Struct({
  ID: Schema.Number,
  SpellID: Branded.SpellIDSchema,
});

type SpellEmpowerRow = Schema.Schema.Type<typeof SpellEmpowerSchema>;

export { SpellEmpowerSchema, type SpellEmpowerRow };
