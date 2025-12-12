import * as Schema from "effect/Schema";

export const TraitSubTreeRowSchema = Schema.Struct({
  Name_lang: Schema.NullOr(Schema.String),
  Description_lang: Schema.NullOr(Schema.String),
  ID: Schema.NumberFromString,
  UiTextureAtlasElementID: Schema.NumberFromString,
  TraitTreeID: Schema.NumberFromString,
});

export type TraitSubTreeRow = Schema.Schema.Type<typeof TraitSubTreeRowSchema>;
