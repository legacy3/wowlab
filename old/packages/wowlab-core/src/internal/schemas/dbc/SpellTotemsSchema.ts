import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellTotemsRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  SpellID: Branded.SpellIDSchema,
  RequiredTotemCategoryID_0: Schema.NumberFromString,
  RequiredTotemCategoryID_1: Schema.NumberFromString,
  Totem_0: Schema.NumberFromString,
  Totem_1: Schema.NumberFromString,
});

export type SpellTotemsRow = Schema.Schema.Type<typeof SpellTotemsRowSchema>;
