import * as Schema from "effect/Schema";
import * as Branded from "./Branded.js";

export const AuraSchema = Schema.Struct({
  casterUnitId: Branded.UnitIDSchema,
  expiresAt: Schema.Number,
  spellId: Branded.SpellIDSchema,
  stacks: Schema.Number,
});

export type Aura = Schema.Schema.Type<typeof AuraSchema>;
