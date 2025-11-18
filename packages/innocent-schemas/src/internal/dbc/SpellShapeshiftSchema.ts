import * as Schema from "effect/Schema";

import * as Branded from "@/Branded";

const SpellShapeshiftSchema = Schema.Struct({
  ID: Schema.Number,
  ShapeshiftExclude: Schema.Array(Schema.Number),
  ShapeshiftMask: Schema.Array(Schema.Number),
  SpellID: Branded.SpellIDSchema,
  StanceBarOrder: Schema.Number,
});

type SpellShapeshiftRow = Schema.Schema.Type<typeof SpellShapeshiftSchema>;

export { SpellShapeshiftSchema, type SpellShapeshiftRow };
