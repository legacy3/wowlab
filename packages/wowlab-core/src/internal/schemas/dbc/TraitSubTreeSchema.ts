import * as Schema from "effect/Schema";

export const TraitSubTreeRowSchema = Schema.Struct({
  Description_lang: Schema.NullOr(Schema.String),
  ID: Schema.NumberFromString,
  Name_lang: Schema.NullOr(Schema.String),
  TraitTreeID: Schema.NumberFromString,
  UiTextureAtlasElementID: Schema.NumberFromString,
});

export type TraitSubTreeRow = Schema.Schema.Type<typeof TraitSubTreeRowSchema>;
