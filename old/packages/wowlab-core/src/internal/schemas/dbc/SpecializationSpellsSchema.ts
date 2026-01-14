import * as Schema from "effect/Schema";

export const SpecializationSpellsRowSchema = Schema.Struct({
  Description_lang: Schema.NullOr(Schema.String),
  ID: Schema.NumberFromString,
  SpecID: Schema.NumberFromString,
  SpellID: Schema.NumberFromString,
  OverridesSpellID: Schema.NumberFromString,
  DisplayOrder: Schema.NumberFromString,
});

export type SpecializationSpellsRow = Schema.Schema.Type<
  typeof SpecializationSpellsRowSchema
>;
