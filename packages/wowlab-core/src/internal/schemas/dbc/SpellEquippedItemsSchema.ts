import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellEquippedItemsRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  SpellID: Branded.SpellIDSchema,
  EquippedItemClass: Schema.NumberFromString,
  EquippedItemInvTypes: Schema.NumberFromString,
  EquippedItemSubclass: Schema.NumberFromString,
});

export type SpellEquippedItemsRow = Schema.Schema.Type<
  typeof SpellEquippedItemsRowSchema
>;
