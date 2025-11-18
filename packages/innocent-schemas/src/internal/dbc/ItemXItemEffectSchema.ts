import * as Schema from "effect/Schema";

const ItemXItemEffectSchema = Schema.Struct({
  ID: Schema.Number,
  ItemEffectID: Schema.Number,
  ItemID: Schema.Number,
});

type ItemXItemEffectRow = Schema.Schema.Type<typeof ItemXItemEffectSchema>;

export { ItemXItemEffectSchema, type ItemXItemEffectRow };
