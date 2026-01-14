import * as Schema from "effect/Schema";

export const ItemXItemEffectRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  ItemEffectID: Schema.NumberFromString,
  ItemID: Schema.NumberFromString,
});

export type ItemXItemEffectRow = Schema.Schema.Type<
  typeof ItemXItemEffectRowSchema
>;
