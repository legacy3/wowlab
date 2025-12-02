import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellTotemsRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  RequiredTotemCategoryID_0: Schema.NumberFromString,
  RequiredTotemCategoryID_1: Schema.NumberFromString,
  SpellID: Branded.SpellIDSchema,
  Totem_0: Schema.NumberFromString,
  Totem_1: Schema.NumberFromString,
});

export type SpellTotemsRow = Schema.Schema.Type<typeof SpellTotemsRowSchema>;
