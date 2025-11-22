import * as Schema from "effect/Schema";

export const ItemStatSchema = Schema.Struct({
  type: Schema.Number,
  value: Schema.Number,
});

export const ItemEffectSchema = Schema.Struct({
  categoryCooldown: Schema.Number,
  charges: Schema.Number,
  cooldown: Schema.Number,
  spellId: Schema.Number,
  triggerType: Schema.Number,
});

export const ItemDataFlatSchema = Schema.Struct({
  binding: Schema.Number,
  buyPrice: Schema.Number,
  classId: Schema.Number,
  description: Schema.String,
  effects: Schema.Array(ItemEffectSchema),
  fileName: Schema.String,
  id: Schema.Number,
  inventoryType: Schema.Number,
  itemLevel: Schema.Number,
  maxCount: Schema.Number,
  name: Schema.String,
  quality: Schema.Number,
  requiredLevel: Schema.Number,
  sellPrice: Schema.Number,
  speed: Schema.Number,
  stackable: Schema.Number,
  stats: Schema.Array(ItemStatSchema),
  subclassId: Schema.Number,
});

export type ItemDataFlat = Schema.Schema.Type<typeof ItemDataFlatSchema>;
