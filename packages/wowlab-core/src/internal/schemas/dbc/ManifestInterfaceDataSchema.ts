import * as Schema from "effect/Schema";

export const ManifestInterfaceDataRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  FilePath: Schema.String,
  FileName: Schema.String,
});

export type ManifestInterfaceDataRow = Schema.Schema.Type<
  typeof ManifestInterfaceDataRowSchema
>;
