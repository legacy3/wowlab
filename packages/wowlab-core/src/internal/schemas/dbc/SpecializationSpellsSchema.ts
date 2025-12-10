import * as Schema from "effect/Schema";

export const SpecializationSpellsRowSchema = Schema.Struct({
  Description_lang: Schema.NullOr(Schema.String),
  DisplayOrder: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  OverridesSpellID: Schema.NumberFromString,
  SpecID: Schema.NumberFromString,
  SpellID: Schema.NumberFromString,
});

export type SpecializationSpellsRow = Schema.Schema.Type<
  typeof SpecializationSpellsRowSchema
>;
