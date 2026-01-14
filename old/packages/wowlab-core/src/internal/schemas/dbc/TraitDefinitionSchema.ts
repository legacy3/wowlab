import * as Schema from "effect/Schema";

export const TraitDefinitionRowSchema = Schema.Struct({
  OverrideName_lang: Schema.NullOr(Schema.String),
  OverrideSubtext_lang: Schema.NullOr(Schema.String),
  OverrideDescription_lang: Schema.NullOr(Schema.String),
  ID: Schema.NumberFromString,
  SpellID: Schema.NumberFromString,
  OverrideIcon: Schema.NumberFromString,
  OverridesSpellID: Schema.NumberFromString,
  VisibleSpellID: Schema.NumberFromString,
});

export type TraitDefinitionRow = Schema.Schema.Type<
  typeof TraitDefinitionRowSchema
>;
