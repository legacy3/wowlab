import * as Schema from "effect/Schema";

export const UiTextureAtlasElementRowSchema = Schema.Struct({
  Name: Schema.String,
  ID: Schema.NumberFromString,
});

export type UiTextureAtlasElementRow = Schema.Schema.Type<
  typeof UiTextureAtlasElementRowSchema
>;

