import * as Schema from "effect/Schema";

export const ManifestInterfaceDataRowSchema = Schema.Struct({
  FileName: Schema.String,
  FilePath: Schema.String,
  ID: Schema.Number,
});

export type ManifestInterfaceDataRow = Schema.Schema.Type<
  typeof ManifestInterfaceDataRowSchema
>;
