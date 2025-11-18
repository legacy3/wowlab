import * as Schema from "effect/Schema";

export const GearItemSchema = Schema.Struct({
  bonusIds: Schema.Array(Schema.Number),
  craftedStats: Schema.optional(Schema.Array(Schema.Number)),
  craftingQuality: Schema.optional(Schema.Number),
  enchantId: Schema.optional(Schema.Number),
  gemIds: Schema.optional(Schema.Array(Schema.Number)),
  id: Schema.Number,
});

export type GearItem = Schema.Schema.Type<typeof GearItemSchema>;
