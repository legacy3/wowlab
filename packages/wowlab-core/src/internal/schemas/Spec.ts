import * as Schema from "effect/Schema";

export const SpecDataFlatSchema = Schema.Struct({
  classId: Schema.Number,
  description: Schema.String,
  iconFileId: Schema.Number,
  id: Schema.Number,
  masterySpellIds: Schema.Tuple(Schema.Number, Schema.Number),
  name: Schema.String,
  orderIndex: Schema.Number,
  role: Schema.Number,
});

export type SpecDataFlat = Schema.Schema.Type<typeof SpecDataFlatSchema>;
