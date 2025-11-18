import * as Schema from "effect/Schema";

export const ItemDataFlatSchema = Schema.Struct({
  // Core
  iconName: Schema.String,
  id: Schema.Number,
  name: Schema.String,

  // Classification
  classId: Schema.Number,
  inventoryType: Schema.Number,
  itemLevel: Schema.Number,
  quality: Schema.Number,
  subclassId: Schema.Number,

  // Requirements
  allowableClass: Schema.String,
  allowableRace: Schema.String,
  requiredLevel: Schema.Number,

  // Description
  description: Schema.String,
});

export type ItemDataFlat = Schema.Schema.Type<typeof ItemDataFlatSchema>;
