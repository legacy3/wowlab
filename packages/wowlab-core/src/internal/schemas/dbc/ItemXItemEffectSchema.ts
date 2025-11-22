import * as Schema from "effect/Schema";

export const ItemXItemEffectRowSchema = Schema.Struct({
  ID: Schema.Number,
  ItemEffectID: Schema.Number,
  ItemID: Schema.Number,
});

export type ItemXItemEffectRow = Schema.Schema.Type<
  typeof ItemXItemEffectRowSchema
>;
