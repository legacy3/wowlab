import * as Schema from "effect/Schema";

const FileDataSchema = Schema.Struct({
  FileName: Schema.String,
  FilePath: Schema.String,
  ID: Schema.Number,
});

type FileDataRow = Schema.Schema.Type<typeof FileDataSchema>;

export { FileDataSchema, type FileDataRow };
