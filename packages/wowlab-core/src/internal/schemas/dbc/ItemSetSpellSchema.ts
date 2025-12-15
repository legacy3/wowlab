import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const ItemSetSpellRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  ChrSpecID: Schema.NumberFromString,
  SpellID: Branded.SpellIDSchema,
  TraitSubTreeID: Schema.NumberFromString,
  Threshold: Schema.NumberFromString,
  ItemSetID: Schema.NumberFromString,
});

export type ItemSetSpellRow = Schema.Schema.Type<typeof ItemSetSpellRowSchema>;
