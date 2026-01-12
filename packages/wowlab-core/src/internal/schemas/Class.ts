import * as Schema from "effect/Schema";

export const ClassDataFlatSchema = Schema.Struct({
  color: Schema.Struct({ b: Schema.Number, g: Schema.Number, r: Schema.Number }),
  fileName: Schema.String,
  iconFileDataId: Schema.Number,
  id: Schema.Number,
  name: Schema.String,
  primaryPowerType: Schema.Number,
  rolesMask: Schema.Number,
  spellClassSet: Schema.Number,
});

export type ClassDataFlat = Schema.Schema.Type<typeof ClassDataFlatSchema>;
